export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-2xl border border-indigo-400/40">
      {message}
    </div>
  );
}
