export function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="toast-container position-fixed top-0 end-0 p-3"
      style={{ zIndex: 9999 }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast show align-items-center text-white border-0 mb-2 ${
            t.type === 'success'
              ? 'bg-success'
              : t.type === 'warning'
              ? 'bg-warning text-dark'
              : 'bg-danger'
          }`}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="d-flex">
            <div className="toast-body fw-medium">{t.message}</div>
            <button
              type="button"
              className="btn-close btn-close-white me-2 m-auto"
              aria-label="Close"
              onClick={() => onRemove(t.id)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
