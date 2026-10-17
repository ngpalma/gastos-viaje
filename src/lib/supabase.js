import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// La app funciona igual en modo "solo local" si todavía no configuraste Supabase.
// En ese caso supabase === null y se usa únicamente localStorage.
export const isCloudConfigured = Boolean(url && anonKey);

export const supabase = isCloudConfigured
  ? createClient(url, anonKey, {
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null;

// Nombre de la tabla en Supabase (ver README para el SQL de creación).
export const ROOMS_TABLE = "rooms";

// Normaliza el nombre de sala para usarlo como clave estable (slug seguro).
export function normalizeRoom(room) {
  return (room || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_]/g, "");
}
