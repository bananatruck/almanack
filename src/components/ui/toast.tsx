"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

// ───────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void;
}

// ───────────────────────────────────────────────────────────
// Context
// ───────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

// ───────────────────────────────────────────────────────────
// Provider
// ───────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = "success", duration = 3000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, message, variant, duration }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// ───────────────────────────────────────────────────────────
// Container
// ───────────────────────────────────────────────────────────

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className="
        fixed bottom-4 right-4 z-[100]
        flex flex-col-reverse gap-2
        max-w-sm w-full pointer-events-none
      "
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Individual Toast
// ───────────────────────────────────────────────────────────

const variantConfig: Record<
  ToastVariant,
  { icon: typeof CheckCircle; color: string; bg: string }
> = {
  success: {
    icon: CheckCircle,
    color: "var(--color-success)",
    bg: "var(--color-success-muted)",
  },
  error: {
    icon: AlertCircle,
    color: "var(--color-error)",
    bg: "var(--color-error-muted)",
  },
  info: {
    icon: Info,
    color: "var(--color-info)",
    bg: "var(--color-info-muted)",
  },
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [exiting, setExiting] = useState(false);
  const config = variantConfig[toast.variant];
  const Icon = config.icon;

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, toast.duration - 300);

    const removeTimer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      role="alert"
      className={`
        pointer-events-auto
        flex items-center gap-3 px-4 py-3
        bg-[var(--bg-elevated)] border border-[var(--border-primary)]
        rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]
        transition-all duration-300 ease-out
        ${exiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0 animate-slide-in"}
      `}
    >
      <div
        className="shrink-0 p-1 rounded-full"
        style={{ backgroundColor: config.bg }}
      >
        <Icon size={16} style={{ color: config.color }} />
      </div>
      <p className="flex-1 text-sm text-[var(--text-primary)]">
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className="
          shrink-0 p-1 rounded-[var(--radius-sm)]
          text-[var(--text-muted)] hover:text-[var(--text-secondary)]
          transition-colors duration-150
        "
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
