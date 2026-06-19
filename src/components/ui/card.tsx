import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className = "",
  hover = false,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-[var(--surface-glass)] backdrop-blur-xl
        border border-[var(--surface-glass-border)]
        rounded-[var(--radius-lg)] p-4
        transition-all duration-250 ease-out
        ${hover ? "hover:bg-[var(--surface-glass-hover)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 cursor-pointer" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
