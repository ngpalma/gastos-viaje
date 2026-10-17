// Historial de pagos ya saldados, con opción de deshacer.
export default function SettledHistory({
  settledPayments,
  getFriend,
  baseCurrency,
  onUndo,
}) {
  if (settledPayments.length === 0) return null;

  return (
    <details className="mb-8 bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
      <summary className="font-semibold text-xs text-slate-400 cursor-pointer select-none flex justify-between items-center">
        <span>Historial de Pagos Saldados ({settledPayments.length})</span>
        <span className="text-indigo-400 text-[11px]">Ver / Deshacer</span>
      </summary>
      <ul className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
        {settledPayments.map((p) => (
          <li
            key={p.id}
            className="flex justify-between items-center text-xs bg-slate-950/70 border border-slate-800/60 px-3 py-2 rounded-xl"
          >
            <span className="text-slate-300">
              <strong className="text-emerald-400">
                {getFriend(p.fromId)?.name || "—"}
              </strong>{" "}
              saldó a{" "}
              <strong className="text-emerald-400">
                {getFriend(p.toId)?.name || "—"}
              </strong>
              :{" "}
              <strong>
                ${p.amount.toLocaleString("es-AR", { maximumFractionDigits: 2 })}{" "}
                {baseCurrency}
              </strong>{" "}
              <span className="text-[10px] text-slate-500">({p.date})</span>
            </span>
            <button
              type="button"
              onClick={() => onUndo(p.id)}
              className="text-slate-500 hover:text-rose-400 text-xs px-2 py-0.5 rounded border border-slate-800 transition-colors"
            >
              Deshacer
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
