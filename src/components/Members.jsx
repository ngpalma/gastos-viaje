// Gestión dinámica de integrantes: arranca con 1 y se agregan/quitan con botones.
export default function Members({
  friends,
  onAdd,
  onRemove,
  onUpdate,
  canRemove,
}) {
  return (
    <details className="mb-4 bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80 shadow-sm">
      <summary className="font-semibold text-xs text-slate-300 cursor-pointer select-none flex justify-between items-center">
        <span className="flex items-center gap-1.5">
          <span>👥</span> Integrantes ({friends.length}) · Nombres y Alias/CBU
        </span>
        <span className="text-slate-400 text-[11px]">Editar</span>
      </summary>

      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {friends.map((f) => (
            <div
              key={f.id}
              className="flex gap-1.5 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800 items-center"
            >
              <input
                type="text"
                value={f.name}
                placeholder="Nombre"
                onChange={(e) => onUpdate(f.id, "name", e.target.value)}
                className="w-[38%] bg-transparent text-xs font-medium text-white px-2 py-1 focus:outline-none rounded"
              />
              <input
                type="text"
                value={f.alias}
                placeholder="Alias / CBU"
                onChange={(e) => onUpdate(f.id, "alias", e.target.value)}
                className="flex-1 min-w-0 bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 px-2 py-1 rounded focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => onRemove(f.id)}
                disabled={!canRemove}
                title={
                  canRemove
                    ? "Quitar integrante"
                    : "No se puede quitar el único integrante"
                }
                className="shrink-0 text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="w-full mt-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 font-semibold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
        >
          <span>➕</span> Agregar integrante
        </button>
      </div>
    </details>
  );
}
