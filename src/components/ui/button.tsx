"use client";

import { type ReactNode, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-semibold shadow-sm hover:brightness-110",
  secondary:
    "bg-[var(--surface-glass)] text-[var(--text-primary)] border border-[var(--border-primary)] backdrop-blur-sm hover:bg-[var(--surface-glass-hover)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-glass)] hover:text-[var(--text-primary)]",
  danger:
    "bg-[var(--color-error)] text-white font-semibold hover:brightness-110",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-[0.8125rem] gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-2.5 text-base gap-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center rounded-[var(--radius-md)]
        border-none cursor-pointer transition-all duration-150 ease-out
        font-[inherit] whitespace-nowrap
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <Loader2
          size={size === "sm" ? 14 : size === "lg" ? 20 : 16}
          className="animate-spin"
        />
      )}
      {children}
    </button>
  );
}
