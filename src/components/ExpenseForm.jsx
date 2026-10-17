import { useEffect, useState } from "react";
import { CATEGORIES, CURRENCIES, uid } from "../constants.js";

// Formulario para cargar un gasto nuevo. Maneja sus propios inputs y
// reconcilia pagador/participantes cuando cambian los integrantes.
export default function ExpenseForm({ friends, baseCurrency, onAdd, onToast }) {
  const allIds = friends.map((f) => f.id);

  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(baseCurrency);
  const [category, setCategory] = useState("comida");
  const [payerId, setPayerId] = useState(allIds[0] || "");
  const [splitWith, setSplitWith] = useState(allIds);

  // Si cambian los integrantes, mantenemos selecciones válidas.
  useEffect(() => {
    const ids = friends.map((f) => f.id);
    setPayerId((prev) => (ids.includes(prev) ? prev : ids[0] || ""));
    setSplitWith((prev) => {
      const valid = prev.filter((id) => ids.includes(id));
      return valid.length > 0 ? valid : ids;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friends]);

  const toggleParticipant = (id) => {
    setSplitWith((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // al menos uno
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  const selectAll = () => setSplitWith(friends.map((f) => f.id));
  const selectOthers = () => {
    const others = friends.filter((f) => f.id !== payerId).map((f) => f.id);
    setSplitWith(others.length > 0 ? others : [payerId]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!desc.trim() || isNaN(parsed) || parsed <= 0) {
      onToast("Ingresá un monto válido");
      return;
    }
    if (splitWith.length === 0) {
      onToast("Elegí al menos un participante");
      return;
    }
    onAdd({
      id: uid("exp"),
      desc: desc.trim(),
      amount: parsed,
      currency,
      category,
      payerId,
      splitWith: [...splitWith],
      date: new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    setDesc("");
    setAmount("");
    setSplitWith(friends.map((f) => f.id));
    onToast("✓ Gasto agregado");
  };

  return (
    <details
      open
      className="bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl mb-8"
    >
      <summary className="cursor-pointer select-none list-none flex items-center justify-between gap-2 mb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>➕</span> Cargar Nuevo Gasto
        </h2>
        <span className="text-indigo-400 text-[11px] underline shrink-0">
          Mostrar / ocultar
        </span>
      </summary>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Categoría */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
            Categoría
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition-all ${
                  category === c.id
                    ? "bg-indigo-600/20 border-indigo-500 text-white font-semibold ring-1 ring-indigo-500"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <span className="text-base mb-0.5">{c.icon}</span>
                <span className="text-[10px] truncate w-full text-center">
                  {c.name.split("/")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Descripción, monto, pagador */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <input
            type="text"
            placeholder="Descripción (ej. Asado, Nafta, Cervezas)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="sm:col-span-5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            required
          />
          <div className="sm:col-span-4 flex">
            <input
              type="number"
              step="any"
              placeholder="Monto"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-2/3 bg-slate-950 border border-r-0 border-slate-800 rounded-l-xl px-3 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500"
              required
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-1/3 bg-slate-900 border border-slate-800 rounded-r-xl px-2 py-2.5 text-xs font-bold text-indigo-400 focus:outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {friends.map((f) => (
                <option key={f.id} value={f.id}>
                  Pagó: {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* División entre participantes */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <span className="text-[11px] font-semibold text-slate-300">
              Se divide entre:{" "}
              <strong className="text-indigo-400">
                {splitWith.length} de {friends.length}
              </strong>
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={selectAll}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-700/60 px-2 py-1 rounded-lg text-indigo-300 transition-colors"
              >
                Todos
              </button>
              <button
                type="button"
                onClick={selectOthers}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-700/60 px-2 py-1 rounded-lg text-slate-300 transition-colors"
              >
                Restantes (sin pagador)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {friends.map((f) => {
              const checked = splitWith.includes(f.id);
              return (
                <label
                  key={f.id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border text-xs select-none transition-all ${
                    checked
                      ? "bg-indigo-950/40 border-indigo-500/50 text-white font-medium"
                      : "bg-slate-900/30 border-slate-800/50 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleParticipant(f.id)}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 h-3.5 w-3.5"
                  />
                  <span className="truncate">{f.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-semibold py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/20"
        >
          Agregar Gasto al Viaje
        </button>
      </form>
    </details>
  );
}
