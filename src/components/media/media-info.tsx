import type { MediaDetails } from "@/lib/providers/types";
import StarRating from "@/components/ui/star-rating";

interface CommunityStats {
  ratingCount: number;
  avgRating: number | null;
  reviewCount: number;
}

interface MediaInfoProps {
  media: MediaDetails;
  communityStats?: CommunityStats;
}

export default function MediaInfo({ media, communityStats }: MediaInfoProps) {
  const metadata = media.metadata as Record<string, unknown>;
  const director = metadata?.director as string | undefined;
  const directors = metadata?.directors as string[] | undefined;
  const cast = metadata?.cast as { name: string; character: string }[] | undefined;
  const studio = metadata?.studio as string | undefined;
  const status = metadata?.status as string | undefined;
  const seasons = metadata?.number_of_seasons as number | undefined;
  const volumes = metadata?.volumes as number | undefined;
  const format = metadata?.format as string | undefined;
  const season = metadata?.season as string | undefined;
  const seasonYear = metadata?.seasonYear as number | undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Synopsis */}
      <div className="lg:col-span-2">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
          Synopsis
        </h2>
        {media.overview ? (
          <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
            {media.overview}
          </p>
        ) : (
          <p className="text-[var(--text-muted)] italic text-sm">
            No synopsis available.
          </p>
        )}

        {/* Cast */}
        {cast && cast.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
              Cast
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {cast.slice(0, 10).map((member) => (
                <div
                  key={member.name}
                  className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--surface-glass)]"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs text-[var(--text-muted)]">
                    {member.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] truncate">
                      {member.character}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Metadata sidebar */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
          Details
        </h2>

        <div className="glass p-4 space-y-3">
          {(director || (directors && directors.length > 0)) && (
            <MetadataRow
              label="Director"
              value={director || directors?.join(", ") || ""}
            />
          )}
          {studio && <MetadataRow label="Studio" value={studio} />}
          {status && (
            <MetadataRow
              label="Status"
              value={status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
            />
          )}
          {seasons && <MetadataRow label="Seasons" value={String(seasons)} />}
          {volumes && <MetadataRow label="Volumes" value={String(volumes)} />}
          {format && (
            <MetadataRow
              label="Format"
              value={format.replace(/_/g, " ")}
            />
          )}
          {season && seasonYear && (
            <MetadataRow
              label="Season"
              value={`${season.charAt(0)}${season.slice(1).toLowerCase()} ${seasonYear}`}
            />
          )}
          {media.releaseDate && (
            <MetadataRow label="Release Date" value={media.releaseDate} />
          )}
        </div>

        {/* Community stats */}
        <div className="glass p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Community
          </h3>
          {communityStats && communityStats.ratingCount > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <StarRating rating={communityStats.avgRating ?? 0} size="sm" showValue />
                <span className="text-xs text-[var(--text-tertiary)]">
                  ({communityStats.ratingCount} rating{communityStats.ratingCount !== 1 ? "s" : ""})
                </span>
              </div>
              <div className="space-y-1.5 text-sm text-[var(--text-tertiary)]">
                <p>{communityStats.reviewCount} review{communityStats.reviewCount !== 1 ? "s" : ""}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-[var(--text-tertiary)]">
              <p>No ratings yet</p>
              <p className="text-xs text-[var(--text-muted)]">Be the first to rate!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide shrink-0">
        {label}
      </span>
      <span className="text-sm text-[var(--text-secondary)] text-right">
        {value}
      </span>
    </div>
  );
}
