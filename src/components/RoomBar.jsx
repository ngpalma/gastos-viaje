import { useState } from "react";

// Barra de configuración de la sala compartida (nombre + PIN) con estado de conexión.
export default function RoomBar({
  room,
  pin,
  connected,
  cloudEnabled,
  onConnect,
  onLeave,
}) {
  const [roomInput, setRoomInput] = useState(room);
  const [pinInput, setPinInput] = useState(pin);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConnect(roomInput, pinInput);
  };

  return (
    <details className="mb-4 bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80 shadow-sm" open={!connected}>
      <summary className="font-semibold text-xs text-slate-300 cursor-pointer select-none flex justify-between items-center">
        <span className="flex items-center gap-1.5">
          <span>☁️</span> Sala compartida en la nube
        </span>
        <span className="text-indigo-400 text-[11px] underline">
          {connected ? `Sala activa: ${room}` : "Configurar sala"}
        </span>
      </summary>

      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
        {!cloudEnabled && (
          <p className="text-[11px] text-amber-300 bg-amber-950/30 border border-amber-800/40 rounded-lg px-3 py-2">
            ⚠️ La nube no está configurada (faltan las claves de Supabase). La app
            funciona igual, pero los datos solo se guardan en este dispositivo.
          </p>
        )}

        <p className="text-[11px] text-slate-400">
          Elegí un nombre de sala único (ej: <code>champaqui-2026</code>) y un PIN.
          Compartí esos dos datos <strong>una sola vez</strong> con tus amigos: todos
          los que entren a la misma sala verán los cambios al instante.
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <input
            type="text"
            placeholder="Nombre de la sala"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            className="sm:col-span-6 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="PIN"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className="sm:col-span-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white text-center focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="sm:col-span-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-xl text-xs transition-colors"
          >
            {connected ? "Reconectar" : "Entrar / Crear"}
          </button>
        </form>

        {connected && (
          <button
            type="button"
            onClick={onLeave}
            className="text-[11px] text-rose-400 hover:text-rose-300 underline"
          >
            Salir de la sala (volver a modo local)
          </button>
        )}
      </div>
    </details>
  );
}
