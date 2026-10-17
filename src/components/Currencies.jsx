import { CURRENCIES } from "../constants.js";

// Moneda base de liquidación y cotizaciones relativas en ARS.
export default function Currencies({ baseCurrency, rates, onBaseChange, onRateChange }) {
  return (
    <details className="mb-6 bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80 shadow-sm">
      <summary className="font-semibold text-xs text-slate-300 cursor-pointer select-none flex justify-between items-center">
        <span className="flex items-center gap-1.5">
          <span>💱</span> Moneda base y cotizaciones
        </span>
        <span className="text-xs bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-lg border border-slate-700 font-semibold">
          Base: {baseCurrency}
        </span>
      </summary>

      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">Moneda de liquidación:</label>
          <select
            value={baseCurrency}
            onChange={(e) => onBaseChange(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-[11px] text-slate-400 mb-2">Equivalencias relativas en ARS:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CURRENCIES.filter((c) => c !== "ARS").map((curr) => (
              <div key={curr} className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">1 {curr} =</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">$</span>
                  <input
                    type="number"
                    value={rates[curr]}
                    onChange={(e) => onRateChange(curr, parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent text-xs text-slate-200 focus:outline-none font-semibold"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </details>
  );
}
