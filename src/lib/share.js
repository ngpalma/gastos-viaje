import { CATEGORIES } from "../constants.js";
import { toBase } from "./calc.js";

// Copia texto al portapapeles (con fallback para contextos no seguros).
export function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      textArea.remove();
      resolve();
    } catch (err) {
      textArea.remove();
      reject(err);
    }
  });
}

// Arma el texto del resumen para compartir por WhatsApp.
export function buildWhatsAppText({
  friends,
  expenses,
  settledPayments,
  baseCurrency,
  rates,
  settlements,
  room,
}) {
  const getName = (id) => friends.find((f) => f.id === id)?.name || "—";
  const nl = "%0A";

  let total = 0;
  const catMap = {};
  expenses.forEach((e) => {
    const inBase = toBase(e.amount, e.currency, rates, baseCurrency);
    total += inBase;
    catMap[e.category] = (catMap[e.category] || 0) + inBase;
  });

  let text = `✈️ *RESUMEN DE GASTOS DEL VIAJE*${nl}`;
  text += `💰 *Gasto Total:* $${total.toLocaleString("es-AR", {
    maximumFractionDigits: 0,
  })} ${baseCurrency}${nl}${nl}`;

  text += `📊 *Por Categoría:*${nl}`;
  CATEGORIES.forEach((c) => {
    const spent = catMap[c.id] || 0;
    if (spent > 0) {
      text += `• ${c.icon} ${c.name}: $${spent.toLocaleString("es-AR", {
        maximumFractionDigits: 0,
      })} ${baseCurrency}${nl}`;
    }
  });

  text += `${nl}⚖️ *TRANSFERENCIAS PENDIENTES:*${nl}`;
  if (settlements.length === 0) {
    text += `🎉 ¡Están todos al día! No hay deudas pendientes.${nl}`;
  } else {
    settlements.forEach((s) => {
      const receiver = friends.find((f) => f.id === s.toId);
      const aliasInfo = receiver?.alias ? ` (Alias: *${receiver.alias}*)` : "";
      text += `👉 *${getName(s.fromId)}* le transfiere a *${getName(
        s.toId
      )}*: $${s.amount.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${baseCurrency}${aliasInfo}${nl}`;
    });
  }

  if (room) {
    text += `${nl}📲 *Entrá a la app en la sala:* *${room}*${nl}${window.location.origin}${window.location.pathname}`;
  }

  return text;
}

// Exporta gastos y pagos a un archivo CSV.
export function exportCSV({
  friends,
  expenses,
  settledPayments,
  baseCurrency,
  rates,
  room,
}) {
  const getName = (id) => friends.find((f) => f.id === id)?.name || "—";

  const headers = [
    "Tipo",
    "Fecha",
    "Descripción",
    "Categoría",
    "Pagado Por",
    "Participantes",
    "Monto Original",
    "Moneda",
    `Monto en ${baseCurrency}`,
  ];

  const rows = expenses.map((e) => [
    "GASTO",
    `"${e.date}"`,
    `"${e.desc.replace(/"/g, '""')}"`,
    CATEGORIES.find((c) => c.id === e.category)?.name || "Otros",
    `"${getName(e.payerId)}"`,
    `"${e.splitWith.map(getName).join(", ")}"`,
    e.amount.toFixed(2),
    e.currency,
    toBase(e.amount, e.currency, rates, baseCurrency).toFixed(2),
  ]);

  settledPayments.forEach((p) => {
    rows.push([
      "PAGO SALDADO",
      `"${p.date}"`,
      `"Saldado de ${getName(p.fromId)} a ${getName(p.toId)}"`,
      "Liquidación",
      `"${getName(p.fromId)}"`,
      `"${getName(p.toId)}"`,
      p.amount.toFixed(2),
      baseCurrency,
      p.amount.toFixed(2),
    ]);
  });

  const csvString =
    "﻿" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gastos_viaje_${room || "amigos"}_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
