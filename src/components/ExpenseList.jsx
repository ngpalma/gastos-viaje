import { useMemo, useState } from "react";
import { CATEGORIES } from "../constants.js";
import { toBase } from "../lib/calc.js";

// Historial de gastos con filtros por categoría y por persona.
export default function ExpenseList({
  expenses,
  friends,
  getFriend,
  baseCurrency,
  rates,
  onDelete,
}) {
  const [filterCategory, setFilterCategory] = useState("todas");
  const [filterPerson, setFilterPerson] = useState("todos");

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchCat = filterCategory === "todas" || e.category === filterCategory;
      const matchPerson =
        filterPerson === "todos" ||
        e.payerId === filterPerson ||
        e.splitWith.includes(filterPerson);
      return matchCat && matchPerson;
    });
  }, [expenses, filterCategory, filterPerson]);

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-1.5">
          <span>📋</span> Historial de Gastos ({filtered.length})
        </h2>

        <div className="flex gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none"
          >
            <option value="todas">Todas las categorías</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>

          <select
            value={filterPerson}
            onChange={(e) => setFilterPerson(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none"
          >
            <option value="todos">Todos los integrantes</option>
            {friends.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/60 p-6 rounded-2xl text-center text-xs text-slate-500">
          No hay gastos registrados que coincidan con el filtro.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((e) => {
            const catObj =
              CATEGORIES.find((c) => c.id === e.category) || CATEGORIES[5];
            const inBase = toBase(e.amount, e.currency, rates, baseCurrency);
            const isAll = e.splitWith.length === friends.length;

            return (
              <div
                key={e.id}
                className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-2xl"
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl p-1.5 rounded-xl bg-slate-950 border border-slate-800">
                      {catObj.icon}
                    </span>
                    <div>
                      <p className="font-semibold text-xs sm:text-sm text-white">
                        {e.desc}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Pagó{" "}
                        <strong className="text-slate-200">
                          {getFriend(e.payerId)?.name || "—"}
                        </strong>{" "}
                        • {e.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-xs sm:text-sm text-emerald-400">
                        ${e.amount.toLocaleString("es-AR")} {e.currency}
                      </p>
                      {e.currency !== baseCurrency && (
                        <p className="text-[10px] text-slate-500">
                          ≈ $
                          {inBase.toLocaleString("es-AR", {
                            maximumFractionDigits: 1,
                          })}{" "}
                          {baseCurrency}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDelete(e.id)}
                      className="text-slate-500 hover:text-rose-400 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-xs transition-colors"
                      title="Eliminar gasto"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400">
                  <div className="flex flex-wrap items-center gap-1">
                    <span>Para:</span>
                    {isAll ? (
                      <span className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-md text-indigo-300 font-medium">
                        Todos ({friends.length})
                      </span>
                    ) : (
                      e.splitWith.map((id) => (
                        <span
                          key={id}
                          className="bg-slate-950 border border-slate-800/80 px-1.5 py-0.5 rounded-md text-slate-300"
                        >
                          {getFriend(id)?.name || "—"}
                        </span>
                      ))
                    )}
                  </div>
                  <span className="text-slate-500 font-mono">
                    ${(inBase / (e.splitWith.length || 1)).toFixed(0)} {baseCurrency}/u
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
