// Convierte un monto de una moneda a la moneda base, usando las cotizaciones (expresadas en ARS).
export function toBase(val, curr, rates, baseCurrency) {
  const rateInArs = rates[curr] || 1;
  const baseRateInArs = rates[baseCurrency] || 1;
  return (val * rateInArs) / baseRateInArs;
}

// Calcula totales, desglose por categoría y las transferencias mínimas para saldar deudas.
// Trabaja con IDs de integrantes (no con nombres), para soportar nombres repetidos o cambios.
export function computeSummary({ friends, expenses, settledPayments, rates, baseCurrency }) {
  let total = 0;
  const catMap = {};
  const balanceMap = {};
  const paidMap = {};
  const owesMap = {};
  const itemsMap = {}; // friendId -> [{ id, desc, category, owe, paid, net }]
  friends.forEach((f) => {
    balanceMap[f.id] = 0;
    paidMap[f.id] = 0;
    owesMap[f.id] = 0;
    itemsMap[f.id] = [];
  });

  expenses.forEach((e) => {
    const inBase = toBase(e.amount, e.currency, rates, baseCurrency);
    total += inBase;
    catMap[e.category] = (catMap[e.category] || 0) + inBase;

    // El que pagó queda "a favor" por el total.
    if (balanceMap[e.payerId] !== undefined) {
      balanceMap[e.payerId] += inBase;
      paidMap[e.payerId] += inBase;
    }
    // Se reparte el gasto entre los participantes.
    const participants = e.splitWith.filter((id) => balanceMap[id] !== undefined);
    const share = inBase / (participants.length || 1);
    participants.forEach((id) => {
      balanceMap[id] -= share;
      owesMap[id] += share;
    });

    // Detalle por integrante: involucrados = participantes ∪ pagador.
    const involved = new Set(participants);
    if (balanceMap[e.payerId] !== undefined) involved.add(e.payerId);
    involved.forEach((id) => {
      const owe = participants.includes(id) ? share : 0;
      const paid = id === e.payerId ? inBase : 0;
      itemsMap[id].push({
        id: e.id,
        desc: e.desc,
        category: e.category,
        owe,
        paid,
        net: paid - owe,
      });
    });
  });

  // Los pagos ya saldados ajustan los balances.
  settledPayments.forEach((p) => {
    if (balanceMap[p.fromId] !== undefined) balanceMap[p.fromId] += p.amount;
    if (balanceMap[p.toId] !== undefined) balanceMap[p.toId] -= p.amount;
  });

  // Saldo neto por integrante (incluye pagos ya saldados).
  const members = friends.map((f) => ({
    id: f.id,
    name: f.name,
    alias: f.alias,
    paid: paidMap[f.id] || 0,
    owes: owesMap[f.id] || 0,
    net: balanceMap[f.id] || 0,
    items: itemsMap[f.id] || [],
  }));

  // Deudas DIRECTAS por par: cada integrante le debe a quien pagó, según los
  // gastos que realmente compartieron (no se reenrutan deudas entre terceros).
  const validIds = new Set(friends.map((f) => f.id));
  const pairMap = {}; // `${deudorId}|${acreedorId}` -> monto que el deudor le debe al acreedor
  expenses.forEach((e) => {
    if (!validIds.has(e.payerId)) return;
    const inBase = toBase(e.amount, e.currency, rates, baseCurrency);
    const participants = e.splitWith.filter((id) => validIds.has(id));
    const share = inBase / (participants.length || 1);
    participants.forEach((id) => {
      if (id === e.payerId) return; // nadie se debe a sí mismo
      const key = `${id}|${e.payerId}`;
      pairMap[key] = (pairMap[key] || 0) + share;
    });
  });

  // Pagos ya saldados, acumulados por par (deudor -> acreedor).
  const settledByPair = {};
  settledPayments.forEach((p) => {
    const key = `${p.fromId}|${p.toId}`;
    settledByPair[key] = (settledByPair[key] || 0) + p.amount;
  });

  // Neteamos ida y vuelta de cada par y restamos lo ya pagado.
  const transfers = [];
  const handled = new Set();
  Object.keys(pairMap).forEach((key) => {
    if (handled.has(key)) return;
    const [a, b] = key.split("|");
    const reverse = `${b}|${a}`;
    handled.add(key);
    handled.add(reverse);

    let net = (pairMap[key] || 0) - (pairMap[reverse] || 0); // >0: a le debe a b
    net -= settledByPair[key] || 0;
    net += settledByPair[reverse] || 0;

    if (net > 0.01) transfers.push({ fromId: a, toId: b, amount: net });
    else if (net < -0.01) transfers.push({ fromId: b, toId: a, amount: -net });
  });

  transfers.sort((x, y) => y.amount - x.amount);

  // Alternativa OPTIMIZADA: menos transferencias, pero cada integrante paga
  // (o recibe) exactamente su saldo neto total. Nadie paga de más; la única
  // diferencia es que podés terminar pagándole a alguien con quien no
  // compartiste un gasto puntual. Se calcula sobre una copia del saldo neto.
  const debtors = [];
  const creditors = [];
  friends.forEach((f) => {
    const net = balanceMap[f.id] || 0;
    if (net < -0.01) debtors.push({ id: f.id, net: -net });
    else if (net > 0.01) creditors.push({ id: f.id, net });
  });
  debtors.sort((a, b) => b.net - a.net);
  creditors.sort((a, b) => b.net - a.net);

  const optimized = [];
  let oi = 0;
  let oj = 0;
  while (oi < debtors.length && oj < creditors.length) {
    const deb = debtors[oi];
    const cred = creditors[oj];
    const amount = Math.min(deb.net, cred.net);
    if (amount > 0.01) {
      optimized.push({ fromId: deb.id, toId: cred.id, amount });
    }
    deb.net -= amount;
    cred.net -= amount;
    if (deb.net <= 0.01) oi++;
    if (cred.net <= 0.01) oj++;
  }

  return {
    totalSpentBase: total,
    categoryBreakdown: catMap,
    settlements: transfers,
    settlementsOptimized: optimized,
    members,
  };
}

// Devuelve true si un integrante aparece en algún gasto o pago (no se puede eliminar en ese caso).
export function friendIsReferenced(friendId, expenses, settledPayments) {
  const inExpenses = expenses.some(
    (e) => e.payerId === friendId || e.splitWith.includes(friendId)
  );
  const inPayments = settledPayments.some(
    (p) => p.fromId === friendId || p.toId === friendId
  );
  return inExpenses || inPayments;
}
