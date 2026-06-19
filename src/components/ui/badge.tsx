import { MEDIA_TYPE_LABELS, type MediaType } from "@/config/constants";

interface BadgeProps {
  type: MediaType;
  size?: "sm" | "md";
  className?: string;
}

export default function Badge({ type, size = "sm", className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-semibold uppercase tracking-wider
        rounded-[var(--radius-sm)]
        ${size === "sm" ? "px-1.5 py-0.5 text-[0.625rem]" : "px-2 py-1 text-xs"}
        ${className}
      `}
      style={{
        backgroundColor: `color-mix(in srgb, var(--color-${type.replace("_", "-")}) 18%, transparent)`,
        color: `var(--color-${type.replace("_", "-")})`,
      }}
    >
      {MEDIA_TYPE_LABELS[type]}
    </span>
  );
}
