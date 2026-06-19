import Image from "next/image";
import type { MediaDetails } from "@/lib/providers/types";
import Badge from "@/components/ui/badge";
import StarRating from "@/components/ui/star-rating";
import MediaActions from "@/components/media/media-actions";

interface MediaHeroProps {
  media: MediaDetails;
  userRating?: {
    id: string;
    score: number;
    isFavorite: boolean;
  } | null;
  userLog?: {
    id: string;
    status: string;
    startedAt: string | null;
    finishedAt: string | null;
    progress: number | null;
  } | null;
}

export default function MediaHero({
  media,
  userRating,
  userLog,
}: MediaHeroProps) {
  const year = media.releaseDate?.split("-")[0];
  const metadata = media.metadata as Record<string, unknown>;
  const runtime = metadata?.runtime as number | undefined;
  const episodes = metadata?.episodes as number | undefined;
  const chapters = metadata?.chapters as number | undefined;
  const tagline = metadata?.tagline as string | undefined;

  return (
    <div className="relative -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 mb-8">
      {/* Backdrop */}
      <div className="relative h-[320px] sm:h-[400px] lg:h-[450px] overflow-hidden">
        {media.backdropUrl ? (
          <Image
            src={media.backdropUrl}
            alt=""
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-primary)]" />
        )}
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-primary)]/80 to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-4 lg:px-6 pb-6">
        <div className="max-w-[var(--max-content-width)] mx-auto flex gap-6 items-end">
          {/* Poster */}
          <div className="hidden sm:block shrink-0 w-[180px] lg:w-[220px] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-lg)] border-2 border-[var(--surface-glass-border)]">
            {media.posterUrl ? (
              <Image
                src={media.posterUrl}
                alt={media.title}
                width={220}
                height={330}
                className="w-full h-auto object-cover"
                priority
              />
            ) : (
              <div className="aspect-[2/3] bg-[var(--bg-tertiary)] flex items-center justify-center">
                <span className="text-5xl">🎬</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge type={media.type} size="md" />
              {year && (
                <span className="text-sm text-[var(--text-secondary)]">{year}</span>
              )}
              {runtime && (
                <span className="text-sm text-[var(--text-tertiary)]">
                  · {Math.floor(runtime / 60)}h {runtime % 60}m
                </span>
              )}
              {episodes && (
                <span className="text-sm text-[var(--text-tertiary)]">
                  · {episodes} episodes
                </span>
              )}
              {chapters && (
                <span className="text-sm text-[var(--text-tertiary)]">
                  · {chapters} chapters
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--text-primary)] leading-tight mb-2">
              {media.title}
            </h1>

            {tagline && (
              <p className="text-sm text-[var(--text-tertiary)] italic mb-3">
                &ldquo;{tagline}&rdquo;
              </p>
            )}

            {/* Genres */}
            {media.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {media.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-2.5 py-1 text-xs rounded-[var(--radius-sm)] bg-[var(--surface-glass)] text-[var(--text-secondary)] border border-[var(--border-secondary)]"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Rating */}
            {media.rating && (
              <div className="flex items-center gap-3 mb-5">
                <StarRating rating={media.rating} size="lg" showValue />
              </div>
            )}

            {/* Action buttons — interactive */}
            <MediaActions
              media={{
                externalId: media.externalId,
                title: media.title,
                type: media.type,
                posterUrl: media.posterUrl,
                provider: media.provider,
              }}
              userRating={userRating}
              userLog={userLog}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
