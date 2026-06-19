import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 14,
  md: 18,
  lg: 24,
};

export default function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  className = "",
}: StarRatingProps) {
  const iconSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: maxRating }, (_, i) => {
        const starIndex = i + 1;
        const fillPercentage = Math.min(
          Math.max(rating - i, 0),
          1
        );

        return (
          <div key={starIndex} className="relative">
            {/* Empty star background */}
            <Star
              size={iconSize}
              className="text-[var(--star-empty)]"
              fill="var(--star-empty)"
              strokeWidth={0}
            />
            {/* Filled star overlay */}
            {fillPercentage > 0 && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercentage * 100}%` }}
              >
                <Star
                  size={iconSize}
                  className="text-[var(--star-filled)]"
                  fill="var(--star-filled)"
                  strokeWidth={0}
                />
              </div>
            )}
          </div>
        );
      })}
      {showValue && (
        <span
          className={`
            ml-1.5 font-semibold text-[var(--text-primary)]
            ${size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm"}
          `}
        >
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
