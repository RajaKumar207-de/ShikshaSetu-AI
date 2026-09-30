import { useCallback, useEffect, useRef, useState } from "react";

// Lightweight top-right toast stack. Usage:
//   const { toasts, showToast, dismissToast } = useToasts();
//   showToast({ type: "success", title: "Sent", message: "...", action });
//   <ToastStack toasts={toasts} onDismiss={dismissToast} />

const ICONS = {
  success: "✓",
  error: "✕",
  warning: "!",
  info: "i",
};

const DEFAULT_DURATION = 4500;

let nextId = 1;

export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
    // Let the exit animation play before unmounting.
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 220);
  }, []);

  const showToast = useCallback((toast) => {
    const id = nextId++;
    setToasts((prev) =>
      [...prev, { type: "info", duration: DEFAULT_DURATION, ...toast, id }].slice(-4)
    );
    return id;
  }, []);

  return { toasts, showToast, dismissToast };
}

function ToastItem({ toast, onDismiss }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.duration);
  const startedAt = useRef(0);

  useEffect(() => {
    if (paused || toast.leaving) return undefined;
    startedAt.current = Date.now();
    const timer = setTimeout(() => onDismiss(toast.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, toast.id, toast.leaving, onDismiss]);

  return (
    <div
      className={`ss-toast ${toast.type}${toast.leaving ? " leaving" : ""}`}
      role={toast.type === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="ss-toast-icon" aria-hidden="true">
        {ICONS[toast.type] || ICONS.info}
      </div>

      <div className="ss-toast-body">
        {toast.title && <strong>{toast.title}</strong>}
        {toast.message && <p>{toast.message}</p>}

        {toast.action && (
          <button
            type="button"
            className="ss-toast-action"
            onClick={() => {
              toast.action.onClick();
              onDismiss(toast.id);
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        className="ss-toast-close"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
      >
        ×
      </button>

      <span
        className="ss-toast-progress"
        style={{
          animationDuration: `${toast.duration}ms`,
          animationPlayState: paused ? "paused" : "running",
        }}
      />
    </div>
  );
}

export function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="ss-toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
