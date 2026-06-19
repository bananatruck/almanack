import Link from "next/link";
import Image from "next/image";
import type { MediaSearchResult } from "@/lib/providers/types";
import StarRating from "@/components/ui/star-rating";
import Badge from "@/components/ui/badge";

interface MediaCarouselProps {
  title: string;
  items: MediaSearchResult[];
  viewAllHref?: string;
}

export default function MediaCarousel({
  title,
  items,
  viewAllHref,
}: MediaCarouselProps) {
  if (items.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          {title}
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] font-medium transition-colors"
          >
            View all →
          </Link>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {items.map((item) => {
          const href = `/media/${item.type}/${item.externalId}?provider=${item.provider}`;
          const year = item.releaseDate?.split("-")[0];

          return (
            <Link
              key={`${item.provider}-${item.externalId}`}
              href={href}
              className="
                group shrink-0 w-[140px] sm:w-[160px]
                rounded-[var(--radius-lg)] overflow-hidden
                bg-[var(--surface-glass)] border border-[var(--surface-glass-border)]
                transition-all duration-250 ease-out
                hover:shadow-[var(--shadow-md)] hover:-translate-y-1
                hover:border-[var(--surface-glass-strong)]
              "
            >
              <div className="relative aspect-[2/3] overflow-hidden bg-[var(--bg-tertiary)]">
                {item.posterUrl ? (
                  <Image
                    src={item.posterUrl}
                    alt={item.title}
                    fill
                    sizes="160px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                    <span className="text-3xl">🎬</span>
                  </div>
                )}
                <div className="absolute top-1.5 left-1.5">
                  <Badge type={item.type} />
                </div>
              </div>
              <div className="p-2.5">
                <h3 className="text-xs font-medium text-[var(--text-primary)] line-clamp-2 leading-tight mb-1">
                  {item.title}
                </h3>
                <div className="flex items-center justify-between">
                  {year && (
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {year}
                    </span>
                  )}
                  {item.rating && <StarRating rating={item.rating} size="sm" />}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
