import { useCallback, useMemo, useState } from "react";
import { useTripData } from "./hooks/useTripData.js";
import { uid } from "./constants.js";
import { computeSummary, friendIsReferenced } from "./lib/calc.js";
import { copyToClipboard, buildWhatsAppText, exportCSV } from "./lib/share.js";

import Toast from "./components/Toast.jsx";
import RoomBar from "./components/RoomBar.jsx";
import Members from "./components/Members.jsx";
import Currencies from "./components/Currencies.jsx";
import ExpenseForm from "./components/ExpenseForm.jsx";
import Settlements from "./components/Settlements.jsx";
import SettledHistory from "./components/SettledHistory.jsx";
import ExpenseList from "./components/ExpenseList.jsx";

export default function App() {
  const [notification, setNotification] = useState("");

  const showToast = useCallback((msg) => {
    setNotification(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setNotification(""), 3000);
  }, []);

  const {
    data,
    setData,
    room,
    pin,
    connected,
    connectRoom,
    leaveRoom,
    syncStatus,
    isSyncing,
    cloudEnabled,
  } = useTripData({ onToast: showToast });

  const { friends, expenses, settledPayments, baseCurrency, rates } = data;

  const update = useCallback(
    (patch) => setData((prev) => ({ ...prev, ...patch })),
    [setData]
  );

  const getFriend = useCallback(
    (id) => friends.find((f) => f.id === id),
    [friends]
  );

  const { totalSpentBase, settlements, members } = useMemo(
    () => computeSummary({ friends, expenses, settledPayments, rates, baseCurrency }),
    [friends, expenses, settledPayments, rates, baseCurrency]
  );

  // --- Integrantes ---
  const addFriend = () => {
    const newFriend = { id: uid("f"), name: `Integrante ${friends.length + 1}`, alias: "" };
    update({ friends: [...friends, newFriend] });
  };

  const removeFriend = (id) => {
    if (friends.length <= 1) {
      showToast("Tiene que haber al menos un integrante");
      return;
    }
    if (friendIsReferenced(id, expenses, settledPayments)) {
      showToast("No se puede quitar: ese integrante tiene gastos o pagos");
      return;
    }
    update({ friends: friends.filter((f) => f.id !== id) });
    showToast("Integrante eliminado");
  };

  const updateFriend = (id, field, value) => {
    update({
      friends: friends.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    });
  };

  // --- Gastos ---
  const addExpense = (expense) => update({ expenses: [expense, ...expenses] });
  const deleteExpense = (id) => {
    update({ expenses: expenses.filter((e) => e.id !== id) });
    showToast("Gasto eliminado");
  };

  // --- Liquidación ---
  const settleDebt = (transfer) => {
    const payment = {
      id: uid("pay"),
      fromId: transfer.fromId,
      toId: transfer.toId,
      amount: transfer.amount,
      date: new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    update({ settledPayments: [payment, ...settledPayments] });
    showToast(`✓ Deuda de ${getFriend(transfer.fromId)?.name || ""} saldada`);
  };

  const undoPayment = (id) => {
    update({ settledPayments: settledPayments.filter((p) => p.id !== id) });
    showToast("Pago deshecho");
  };

  const copyAlias = (id) => {
    const friend = getFriend(id);
    if (friend && friend.alias?.trim()) {
      copyToClipboard(friend.alias.trim()).then(() =>
        showToast(`¡Alias de ${friend.name} copiado!`)
      );
    } else {
      showToast("Ese integrante no tiene alias configurado");
    }
  };

  // --- Monedas ---
  const onBaseChange = (value) => update({ baseCurrency: value });
  const onRateChange = (curr, value) =>
    update({ rates: { ...rates, [curr]: value } });

  // --- Compartir ---
  const shareWhatsApp = () => {
    const text = buildWhatsAppText({
      friends,
      expenses,
      settledPayments,
      baseCurrency,
      rates,
      settlements,
      room,
    });
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleExportCSV = () => {
    if (expenses.length === 0 && settledPayments.length === 0) {
      showToast("No hay registros para exportar");
      return;
    }
    exportCSV({ friends, expenses, settledPayments, baseCurrency, rates, room });
    showToast("Archivo CSV descargado");
  };

  const perHead =
    friends.length > 0 ? totalSpentBase / friends.length : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-20">
      <Toast message={notification} />

      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 mb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl">🗺️</span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Gastos de Viaje
            </h1>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                syncStatus === "Sincronizado"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {isSyncing ? "Sincronizando..." : syncStatus}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Total acumulado:{" "}
            <strong className="text-emerald-400 font-bold">
              ${totalSpentBase.toLocaleString("es-AR", { maximumFractionDigits: 0 })}{" "}
              {baseCurrency}
            </strong>{" "}
            • ({perHead.toLocaleString("es-AR", { maximumFractionDigits: 0 })}{" "}
            {baseCurrency} c/u)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={shareWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <span>💬</span> WhatsApp
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium px-3 py-2 rounded-xl text-xs transition-all active:scale-95"
          >
            CSV
          </button>
        </div>
      </header>

      <RoomBar
        room={room}
        pin={pin}
        connected={connected}
        cloudEnabled={cloudEnabled}
        onConnect={connectRoom}
        onLeave={leaveRoom}
      />

      <Members
        friends={friends}
        onAdd={addFriend}
        onRemove={removeFriend}
        onUpdate={updateFriend}
        canRemove={friends.length > 1}
      />

      <Currencies
        baseCurrency={baseCurrency}
        rates={rates}
        onBaseChange={onBaseChange}
        onRateChange={onRateChange}
      />

      <ExpenseForm
        friends={friends}
        baseCurrency={baseCurrency}
        onAdd={addExpense}
        onToast={showToast}
      />

      <Settlements
        settlements={settlements}
        members={members}
        getFriend={getFriend}
        baseCurrency={baseCurrency}
        onSettle={settleDebt}
        onCopyAlias={copyAlias}
      />

      <SettledHistory
        settledPayments={settledPayments}
        getFriend={getFriend}
        baseCurrency={baseCurrency}
        onUndo={undoPayment}
      />

      <ExpenseList
        expenses={expenses}
        friends={friends}
        getFriend={getFriend}
        baseCurrency={baseCurrency}
        rates={rates}
        onDelete={deleteExpense}
      />

      <footer className="mt-10 pt-6 border-t border-slate-800 text-center text-[10px] text-slate-600">
        Hecho para dividir gastos entre amigos ✈️
      </footer>
    </div>
  );
}
