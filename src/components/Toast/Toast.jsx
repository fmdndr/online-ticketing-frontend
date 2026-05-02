export function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        let bgColor = 'bg-red-500';
        let textColor = 'text-white';
        if (t.type === 'success') {
          bgColor = 'bg-green-500';
        } else if (t.type === 'warning') {
          bgColor = 'bg-yellow-500';
          textColor = 'text-black';
        } else if (t.type === 'error' || t.type === 'danger') {
          bgColor = 'bg-red-500';
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded shadow-lg min-w-[300px] ${bgColor} ${textColor}`}
            role="alert"
          >
            <div className="font-medium text-sm">{t.message}</div>
            <button
              type="button"
              className="ml-4 opacity-80 hover:opacity-100"
              onClick={() => onRemove(t.id)}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
