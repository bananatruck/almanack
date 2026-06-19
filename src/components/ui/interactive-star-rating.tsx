"use client";

import { useState, useCallback } from "react";
import { Star, X } from "lucide-react";

interface InteractiveStarRatingProps {
  rating: number;
  onChange: (score: number) => void;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showClear?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 20, gap: "gap-1" },
  md: { icon: 28, gap: "gap-1.5" },
  lg: { icon: 36, gap: "gap-2" },
};

export default function InteractiveStarRating({
  rating,
  onChange,
  maxRating = 5,
  size = "md",
  showClear = true,
  className = "",
}: InteractiveStarRatingProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const { icon: iconSize, gap } = sizeMap[size];

  const displayRating = hoverIndex !== null ? hoverIndex : rating;

  const handleMouseEnter = useCallback((starIndex: number) => {
    setHoverIndex(starIndex);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverIndex(null);
  }, []);

  const handleClick = useCallback(
    (starIndex: number) => {
      // If clicking the same star that's already selected, deselect
      if (rating === starIndex && showClear) {
        onChange(0);
      } else {
        onChange(starIndex);
      }
    },
    [rating, onChange, showClear]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        const next = Math.min(rating + 1, maxRating);
        onChange(next);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        const prev = Math.max(rating - 1, 0);
        onChange(prev);
      }
    },
    [rating, maxRating, onChange]
  );

  return (
    <div
      className={`inline-flex items-center ${gap} ${className}`}
      role="radiogroup"
      aria-label="Rating"
      onKeyDown={handleKeyDown}
    >
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= displayRating;
        const isHovering = hoverIndex !== null;

        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={starValue === rating}
            aria-label={`${starValue} star${starValue !== 1 ? "s" : ""}`}
            tabIndex={starValue === (rating || 1) ? 0 : -1}
            className={`
              relative cursor-pointer p-0.5 rounded-[var(--radius-sm)]
              transition-all duration-150 ease-out
              hover:scale-110 active:scale-95
              focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)] focus-visible:outline-offset-2
              ${isHovering ? "transform" : ""}
            `}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(starValue)}
          >
            <Star
              size={iconSize}
              className={`
                transition-colors duration-150
                ${
                  isFilled
                    ? "text-[var(--star-filled)] drop-shadow-[0_0_6px_rgba(245,166,35,0.4)]"
                    : "text-[var(--star-empty)]"
                }
              `}
              fill={isFilled ? "var(--star-filled)" : "var(--star-empty)"}
              strokeWidth={0}
            />
          </button>
        );
      })}

      {/* Rating value label */}
      {displayRating > 0 && (
        <span
          className={`
            ml-1 font-bold text-[var(--text-primary)] tabular-nums
            transition-all duration-150
            ${size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base"}
          `}
        >
          {displayRating}
        </span>
      )}

      {/* Clear button */}
      {showClear && rating > 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="
            ml-1 p-1 rounded-[var(--radius-sm)]
            text-[var(--text-muted)] hover:text-[var(--color-error)]
            hover:bg-[var(--color-error-muted)]
            transition-all duration-150
          "
          aria-label="Clear rating"
        >
          <X size={size === "sm" ? 14 : size === "lg" ? 20 : 16} />
        </button>
      )}
    </div>
  );
}
