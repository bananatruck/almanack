import type { MediaSearchResult } from "@/lib/providers/types";
import MediaCard from "./media-card";

interface MediaGridProps {
  items: MediaSearchResult[];
  className?: string;
}

export default function MediaGrid({ items, className = "" }: MediaGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-5xl mb-4">🔍</span>
        <p className="text-[var(--text-secondary)] text-lg font-medium">
          No results found
        </p>
        <p className="text-[var(--text-tertiary)] text-sm mt-1">
          Try a different search term
        </p>
      </div>
    );
  }

  return (
    <div
      className={`
        grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4
        ${className}
      `}
    >
      {items.map((item, index) => (
        <div
          key={`${item.provider}-${item.externalId}`}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 30}ms` }}
        >
          <MediaCard item={item} />
        </div>
      ))}
    </div>
  );
}
