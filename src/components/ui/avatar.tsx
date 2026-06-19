import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: { px: 32, text: "text-xs" },
  md: { px: 40, text: "text-sm" },
  lg: { px: 56, text: "text-lg" },
  xl: { px: 80, text: "text-2xl" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({
  src,
  name,
  size = "md",
  className = "",
}: AvatarProps) {
  const { px, text } = sizeMap[size];

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        className={`rounded-full object-cover border-2 border-[var(--border-primary)] ${className}`}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <div
      className={`
        rounded-full flex items-center justify-center
        bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)]
        text-white font-semibold ${text}
        border-2 border-[var(--border-primary)]
        ${className}
      `}
      style={{ width: px, height: px }}
    >
      {getInitials(name)}
    </div>
  );
}
