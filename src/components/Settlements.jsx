import { useState } from "react";
import MemberBalances from "./MemberBalances.jsx";

// Sección desplegable de deudas: saldo por integrante + dos vistas de pagos.
export default function Settlements({
  settlements,
  settlementsOptimized = [],
  members,
  getFriend,
  baseCurrency,
  onSettle,
  onCopyAlias,
}) {
  // "directo" = deuda real por persona (se pueden marcar pagos).
  // "optimizado" = menos transferencias (solo informativo).
  const [mode, setMode] = useState("directo");

  const list = mode === "directo" ? settlements : settlementsOptimized;

  return (
    <details
      open
      className="mb-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm"
    >
      <summary className="cursor-pointer select-none list-none flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-white flex items-center gap-1.5">
          <span>⚖️</span> Deudas Pendientes
        </h2>
        <span className="text-indigo-400 text-[11px] underline shrink-0">
          Mostrar / ocultar
        </span>
      </summary>

      <div className="mt-3">
        {/* Saldo total por integrante */}
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Saldo por integrante
        </h3>
        <MemberBalances members={members} baseCurrency={baseCurrency} />

        {/* Selector de vista */}
        <div className="flex items-center gap-1.5 mt-5 mb-3 bg-slate-950 border border-slate-800 rounded-xl p-1 w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setMode("directo")}
            className={`flex-1 sm:flex-none text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              mode === "directo"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Deuda real
          </button>
          <button
            type="button"
            onClick={() => setMode("optimizado")}
            className={`flex-1 sm:flex-none text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              mode === "optimizado"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Menos transferencias
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mb-3">
          {mode === "directo" ? (
            <>
              Cada uno le paga directamente a quien le debe según los gastos
              compartidos. <strong className="text-slate-300">{list.length}</strong>{" "}
              {list.length === 1 ? "pago" : "pagos"}.
            </>
          ) : (
            <>
              Menos pagos para saldar todo. Nadie paga de más: cada uno paga
              exactamente su saldo, pero puede tocarte pagarle a alguien con quien
              no compartiste un gasto puntual.{" "}
              <strong className="text-slate-300">{list.length}</strong>{" "}
              {list.length === 1 ? "pago" : "pagos"}.
            </>
          )}
        </p>

        {mode === "optimizado" && list.length > 0 && (
          <p className="text-[10px] text-amber-300/90 bg-amber-950/20 border border-amber-800/30 rounded-lg px-2.5 py-1.5 mb-3">
            ℹ️ Vista informativa. Para registrar un pago como hecho, usá la vista
            “Deuda real”.
          </p>
        )}

        {list.length === 0 ? (
          <div className="bg-emerald-950/20 border border-emerald-800/40 p-4 rounded-xl text-center">
            <span className="text-2xl block mb-1">🎉</span>
            <p className="text-xs text-emerald-300 font-medium">
              ¡Están todas las cuentas al día!
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {list.map((s, idx) => {
              const from = getFriend(s.fromId);
              const to = getFriend(s.toId);
              const alias = to?.alias?.trim();

              return (
                <li
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl"
                >
                  <div>
                    <div className="text-xs text-slate-200">
                      <strong className="text-rose-400">{from?.name || "—"}</strong>{" "}
                      le transfiere a{" "}
                      <strong className="text-emerald-400">{to?.name || "—"}</strong>
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      $
                      {s.amount.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {baseCurrency}
                    </div>
                    {alias ? (
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <span>Alias:</span>
                        <span className="font-mono text-emerald-400">{alias}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {alias ? (
                      <button
                        type="button"
                        onClick={() => onCopyAlias(s.toId)}
                        className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <span>📋</span> Copiar Alias
                      </button>
                    ) : null}

                    {mode === "directo" && (
                      <button
                        type="button"
                        onClick={() => onSettle(s)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 flex items-center gap-1"
                      >
                        <span>✓</span> Marcar como pagado
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </details>
  );
}
