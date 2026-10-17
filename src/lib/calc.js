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

  const debtors = [];
  const creditors = [];
  Object.keys(balanceMap).forEach((id) => {
    const net = balanceMap[id];
    if (net < -0.01) debtors.push({ id, net: Math.abs(net) });
    else if (net > 0.01) creditors.push({ id, net });
  });

  debtors.sort((a, b) => b.net - a.net);
  creditors.sort((a, b) => b.net - a.net);

  const transfers = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const deb = debtors[i];
    const cred = creditors[j];
    const amount = Math.min(deb.net, cred.net);

    if (amount > 0.01) {
      transfers.push({ fromId: deb.id, toId: cred.id, amount });
    }

    deb.net -= amount;
    cred.net -= amount;
    if (deb.net <= 0.01) i++;
    if (cred.net <= 0.01) j++;
  }

  return {
    totalSpentBase: total,
    categoryBreakdown: catMap,
    settlements: transfers,
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
