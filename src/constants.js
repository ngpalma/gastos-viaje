// Categorías de gasto disponibles
export const CATEGORIES = [
  { id: "comida", name: "Comida / Salidas", icon: "🍔" },
  { id: "combustible", name: "Combustible", icon: "⛽" },
  { id: "hospedaje", name: "Hospedaje", icon: "🏠" },
  { id: "super", name: "Supermercado", icon: "🛒" },
  { id: "actividades", name: "Peajes / Paseos", icon: "🎟️" },
  { id: "otros", name: "Otros", icon: "📦" },
];

export const CURRENCIES = ["ARS", "USD", "EUR", "BRL", "CLP"];

// Genera un id corto y único (para integrantes, gastos y pagos)
export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Estado inicial: arranca con UN solo integrante.
export function createInitialData() {
  return {
    baseCurrency: "ARS",
    rates: { ARS: 1, USD: 1250, EUR: 1350, BRL: 230, CLP: 1.3 },
    friends: [{ id: uid("f"), name: "Yo", alias: "" }],
    expenses: [],
    settledPayments: [],
  };
}

// Clave de almacenamiento local (respaldo offline)
export const LS_DATA_KEY = "viaje_storage_v4";
export const LS_ROOM_KEY = "viaje_cloud_room_id";
export const LS_PIN_KEY = "viaje_cloud_pin";
