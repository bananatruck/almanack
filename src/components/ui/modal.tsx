"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  className = "",
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function handleCancel(e: Event) {
      e.preventDefault();
      onClose();
    }

    function handleClick(e: MouseEvent) {
      // Close on backdrop click
      if (e.target === dialog) {
        onClose();
      }
    }

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("click", handleClick);

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("click", handleClick);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className={`
        m-auto p-0 border-none rounded-[var(--radius-xl)]
        bg-[var(--bg-elevated)] text-[var(--text-primary)]
        shadow-[var(--shadow-lg)] max-w-lg w-[calc(100vw-2rem)]
        backdrop:bg-black/60 backdrop:backdrop-blur-sm
        open:animate-fade-in
        ${className}
      `}
    >
      <div className="p-6">
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="
                p-1.5 rounded-[var(--radius-md)]
                text-[var(--text-tertiary)] hover:text-[var(--text-primary)]
                hover:bg-[var(--surface-glass)] transition-colors duration-150
              "
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </dialog>
  );
}
