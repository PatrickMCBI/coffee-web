"use client";

export default function ToastStack({ toasts, onDismiss, onView }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1080 }}>
      {toasts.map((t) => (
        <div key={t.id} className="toast show shadow-lg mb-2" role="alert">
          <div className="toast-header" style={{ backgroundColor: "var(--coffee-dark)", color: "#fff" }}>
            <i className="bi bi-bell-fill me-2"></i>
            <strong className="me-auto">New order!</strong>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={() => onDismiss(t.id)}
              aria-label="Close"
            ></button>
          </div>
          <div className="toast-body">
            <div className="fw-semibold">{t.order.customerName || "Customer"}</div>
            <div className="small text-muted">
              {(t.order.items || []).reduce((n, i) => n + i.qty, 0)} item(s) · ₱
              {Number(t.order.total || 0).toFixed(2)}
            </div>
            <div className="mt-2">
              <button
                className="btn btn-sm btn-coffee"
                onClick={() => {
                  onView();
                  onDismiss(t.id);
                }}
              >
                View order
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
