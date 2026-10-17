import { useCallback, useEffect, useRef, useState } from "react";
import {
  supabase,
  isCloudConfigured,
  ROOMS_TABLE,
  normalizeRoom,
} from "../lib/supabase.js";
import {
  createInitialData,
  uid,
  LS_DATA_KEY,
  LS_ROOM_KEY,
  LS_PIN_KEY,
} from "../constants.js";

// Serializa data + pin para comparar si algo realmente cambió respecto de la nube.
function payloadJson(data, pin) {
  return JSON.stringify({ pin: pin || "", data });
}

/**
 * Hook central: maneja el estado del viaje, el respaldo en localStorage
 * y la sincronización en tiempo real con Supabase (modelo sala + PIN).
 */
export function useTripData({ onToast }) {
  const [data, setData] = useState(createInitialData);
  const [room, setRoom] = useState("");
  const [pin, setPin] = useState("");
  const [connected, setConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(
    isCloudConfigured ? "Local" : "Solo local"
  );

  const clientId = useRef(uid("client")).current;
  const lastSyncedRef = useRef(null); // JSON de lo último que sabemos que está en la nube
  const channelRef = useRef(null);
  const didInit = useRef(false);

  const toast = useCallback(
    (msg) => {
      if (onToast) onToast(msg);
    },
    [onToast]
  );

  // Aplica datos recibidos (de la nube) sin volver a dispararlos hacia la nube.
  const applyRemote = useCallback((remoteData, remotePin) => {
    lastSyncedRef.current = payloadJson(remoteData, remotePin);
    setPin(remotePin || "");
    setData(remoteData);
  }, []);

  // Suscripción realtime a la fila de la sala.
  const subscribeRealtime = useCallback(
    (roomKey) => {
      if (!supabase) return;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      const channel = supabase
        .channel(`room:${roomKey}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: ROOMS_TABLE,
            filter: `id=eq.${roomKey}`,
          },
          (payload) => {
            const row = payload.new;
            if (!row || !row.data) return;
            // Ignoramos el eco de nuestras propias escrituras.
            if (row.last_writer === clientId) return;
            applyRemote(row.data, row.pin);
            toast("🔄 Actualizado por otro integrante");
          }
        )
        .subscribe();
      channelRef.current = channel;
    },
    [applyRemote, clientId, toast]
  );

  // Conecta (o crea) una sala. Devuelve true si quedó conectada.
  const connectRoom = useCallback(
    async (rawRoom, rawPin) => {
      const roomKey = normalizeRoom(rawRoom);
      const pinValue = (rawPin || "").trim();

      if (!roomKey) {
        toast("Poné un nombre de sala");
        return false;
      }

      // Sin Supabase configurado: solo guardamos la sala localmente.
      if (!supabase) {
        setRoom(roomKey);
        setPin(pinValue);
        setConnected(false);
        setSyncStatus("Solo local (sin nube configurada)");
        localStorage.setItem(LS_ROOM_KEY, roomKey);
        localStorage.setItem(LS_PIN_KEY, pinValue);
        return false;
      }

      setIsSyncing(true);
      setSyncStatus("Conectando...");
      try {
        const { data: rows, error } = await supabase
          .from(ROOMS_TABLE)
          .select("id, pin, data")
          .eq("id", roomKey)
          .limit(1);

        if (error) throw error;

        const existing = rows && rows[0];

        if (existing) {
          // La sala ya existe: validamos PIN.
          if ((existing.pin || "") !== "" && existing.pin !== pinValue) {
            setSyncStatus("PIN incorrecto");
            toast("🔒 PIN de la sala incorrecto");
            setIsSyncing(false);
            return false;
          }
          setRoom(roomKey);
          applyRemote(existing.data || createInitialData(), existing.pin || "");
          setConnected(true);
          setSyncStatus("Sincronizado");
          toast("✓ Conectado a la sala");
        } else {
          // La sala no existe: la creamos con los datos actuales.
          const initial = data;
          const { error: insertErr } = await supabase.from(ROOMS_TABLE).insert({
            id: roomKey,
            pin: pinValue,
            data: initial,
            last_writer: clientId,
          });
          if (insertErr) throw insertErr;
          setRoom(roomKey);
          setPin(pinValue);
          lastSyncedRef.current = payloadJson(initial, pinValue);
          setConnected(true);
          setSyncStatus("Sala creada ✓");
          toast("✓ Sala creada");
        }

        subscribeRealtime(roomKey);
        localStorage.setItem(LS_ROOM_KEY, roomKey);
        localStorage.setItem(LS_PIN_KEY, pinValue);
        setIsSyncing(false);
        return true;
      } catch (err) {
        console.error("connectRoom error:", err);
        setSyncStatus("Error de conexión");
        toast("⚠️ No se pudo conectar a la nube");
        setIsSyncing(false);
        return false;
      }
    },
    [applyRemote, clientId, data, subscribeRealtime, toast]
  );

  // Sale de la sala (vuelve a modo local).
  const leaveRoom = useCallback(() => {
    if (channelRef.current && supabase) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setConnected(false);
    setRoom("");
    setSyncStatus(isCloudConfigured ? "Local" : "Solo local");
    lastSyncedRef.current = null;
    localStorage.removeItem(LS_ROOM_KEY);
    localStorage.removeItem(LS_PIN_KEY);
    toast("Saliste de la sala");
  }, [toast]);

  // Carga inicial desde localStorage + reconexión automática a la última sala.
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const localRaw = localStorage.getItem(LS_DATA_KEY);
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw);
        if (parsed && parsed.friends) setData(parsed);
      } catch (err) {
        console.error("Error leyendo datos locales:", err);
      }
    }

    const savedRoom = localStorage.getItem(LS_ROOM_KEY);
    const savedPin = localStorage.getItem(LS_PIN_KEY) || "";
    if (savedRoom) {
      setRoom(savedRoom);
      setPin(savedPin);
      if (supabase) {
        connectRoom(savedRoom, savedPin);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guarda en localStorage y (si hay sala conectada) sincroniza a la nube con debounce.
  useEffect(() => {
    // Respaldo local siempre.
    try {
      localStorage.setItem(LS_DATA_KEY, JSON.stringify(data));
    } catch (err) {
      console.error("Error guardando local:", err);
    }

    if (!supabase || !connected || !room) return;

    const current = payloadJson(data, pin);
    if (current === lastSyncedRef.current) return; // nada nuevo que subir

    setSyncStatus("Guardando...");
    const timer = setTimeout(async () => {
      try {
        const { error } = await supabase.from(ROOMS_TABLE).upsert({
          id: room,
          pin: pin || "",
          data,
          last_writer: clientId,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
        lastSyncedRef.current = current;
        setSyncStatus("Sincronizado");
      } catch (err) {
        console.error("Error subiendo a la nube:", err);
        setSyncStatus("Guardado local (sin red)");
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [data, pin, room, connected, clientId]);

  // Limpieza del canal al desmontar.
  useEffect(() => {
    return () => {
      if (channelRef.current && supabase) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    data,
    setData,
    room,
    setRoom,
    pin,
    setPin,
    connected,
    connectRoom,
    leaveRoom,
    syncStatus,
    isSyncing,
    cloudEnabled: isCloudConfigured,
  };
}
