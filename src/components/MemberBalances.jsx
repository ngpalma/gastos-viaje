import { CATEGORIES } from "../constants.js";

const fmt = (n) =>
  Math.abs(n).toLocaleString("es-AR", { maximumFractionDigits: 0 });

const iconOf = (catId) =>
  CATEGORIES.find((c) => c.id === catId)?.icon || "📦";

// Resumen de saldo neto por integrante, con detalle expandible por gasto.
export default function MemberBalances({ members, baseCurrency }) {
  if (!members || members.length === 0) return null;

  return (
    <div className="space-y-2">
      {members.map((m) => {
        const owes = m.net < -0.01; // debe
        const owed = m.net > 0.01; // le deben
        const statusColor = owes
          ? "text-rose-400"
          : owed
          ? "text-emerald-400"
          : "text-slate-400";
        const statusLabel = owes
          ? "debe"
          : owed
          ? "le deben"
          : "al día";

        return (
          <details
            key={m.id}
            className="bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden"
          >
            <summary className="flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer select-none list-none">
              <span className="text-xs font-semibold text-white truncate">
                {m.name}
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-bold ${statusColor}`}>
                  {owes || owed ? (
                    <>
                      {statusLabel} ${fmt(m.net)} {baseCurrency}
                    </>
                  ) : (
                    <>✓ al día</>
                  )}
                </span>
                <span className="text-slate-600 text-[10px]">▼</span>
              </span>
            </summary>

            <div className="px-3 pb-3 pt-1 border-t border-slate-800/60 space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                <span>
                  Pagó: <strong className="text-slate-300">${fmt(m.paid)}</strong>
                </span>
                <span>
                  Le toca: <strong className="text-slate-300">${fmt(m.owes)}</strong>
                </span>
              </div>

              {m.items.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">
                  Sin gastos registrados.
                </p>
              ) : (
                <ul className="space-y-1">
                  {m.items.map((it, idx) => (
                    <li
                      key={`${it.id}_${idx}`}
                      className="flex items-center justify-between gap-2 text-[11px] bg-slate-900/60 border border-slate-800/60 rounded-lg px-2 py-1.5"
                    >
                      <span className="flex items-center gap-1.5 truncate text-slate-300">
                        <span>{iconOf(it.category)}</span>
                        <span className="truncate">{it.desc}</span>
                        {it.paid > 0 && (
                          <span className="text-[9px] uppercase tracking-wide text-indigo-300 bg-indigo-950/50 border border-indigo-800/40 rounded px-1 py-0.5">
                            pagó
                          </span>
                        )}
                      </span>
                      <span
                        className={`font-mono font-semibold shrink-0 ${
                          it.net > 0.01
                            ? "text-emerald-400"
                            : it.net < -0.01
                            ? "text-rose-400"
                            : "text-slate-400"
                        }`}
                      >
                        {it.net >= 0 ? "+" : "−"}${fmt(it.net)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}
