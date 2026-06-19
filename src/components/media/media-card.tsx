import Link from "next/link";
import Image from "next/image";
import type { MediaSearchResult } from "@/lib/providers/types";
import Badge from "@/components/ui/badge";
import StarRating from "@/components/ui/star-rating";

interface MediaCardProps {
  item: MediaSearchResult;
  className?: string;
}

export default function MediaCard({ item, className = "" }: MediaCardProps) {
  const href = `/media/${item.type}/${item.externalId}?provider=${item.provider}`;
  const year = item.releaseDate?.split("-")[0];

  return (
    <Link
      href={href}
      className={`
        group block rounded-[var(--radius-lg)] overflow-hidden
        bg-[var(--surface-glass)] border border-[var(--surface-glass-border)]
        transition-all duration-250 ease-out
        hover:shadow-[var(--shadow-md)] hover:-translate-y-1
        hover:border-[var(--surface-glass-strong)]
        ${className}
      `}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[var(--bg-tertiary)]">
        {item.posterUrl ? (
          <Image
            src={item.posterUrl}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
            <span className="text-4xl">🎬</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex items-end p-3">
          <span className="text-white text-xs font-medium">View Details →</span>
        </div>

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <Badge type={item.type} />
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 leading-tight">
          {item.title}
        </h3>
        <div className="flex items-center justify-between mt-1.5">
          {year && (
            <span className="text-xs text-[var(--text-tertiary)]">{year}</span>
          )}
          {item.rating && (
            <StarRating rating={item.rating} size="sm" />
          )}
        </div>
      </div>
    </Link>
  );
}
