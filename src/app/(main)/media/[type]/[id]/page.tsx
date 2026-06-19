import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { eq, and, sql } from "drizzle-orm";
import { getMediaDetails } from "@/lib/providers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import type { MediaType } from "@/config/constants";
import { MEDIA_TYPES } from "@/config/constants";
import MediaHero from "@/components/media/media-hero";
import MediaInfo from "@/components/media/media-info";

interface MediaDetailPageProps {
  params: Promise<{ type: string; id: string }>;
}

const validTypes = Object.values(MEDIA_TYPES);

export default async function MediaDetailPage({ params }: MediaDetailPageProps) {
  const { type, id } = await params;

  if (!validTypes.includes(type as MediaType)) {
    notFound();
  }

  const media = await getMediaDetails(id, type as MediaType);

  if (!media) {
    notFound();
  }

  // Fetch user's rating and log (if authenticated)
  let userRating = null;
  let userLog = null;
  let ratingCount = 0;
  let avgRating = null as number | null;
  let reviewCount = 0;

  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (session?.user) {
      // Find the internal media item ID by external ID
      const providerKey = `${media.provider}_id`;
      const mediaItem = await db
        .select({ id: schema.mediaItems.id })
        .from(schema.mediaItems)
        .where(
          sql`${schema.mediaItems.externalIds} ->> ${providerKey} = ${id}`
        )
        .limit(1);

      if (mediaItem.length > 0) {
        const mediaItemId = mediaItem[0].id;

        // Fetch user's rating
        const ratings = await db
          .select({
            id: schema.ratings.id,
            score: schema.ratings.score,
            isFavorite: schema.ratings.isFavorite,
          })
          .from(schema.ratings)
          .where(
            and(
              eq(schema.ratings.userId, session.user.id),
              eq(schema.ratings.mediaItemId, mediaItemId)
            )
          )
          .limit(1);

        if (ratings.length > 0) {
          userRating = ratings[0];
        }

        // Fetch user's log
        const logs = await db
          .select({
            id: schema.logs.id,
            status: schema.logs.status,
            startedAt: schema.logs.startedAt,
            finishedAt: schema.logs.finishedAt,
            progress: schema.logs.progress,
          })
          .from(schema.logs)
          .where(
            and(
              eq(schema.logs.userId, session.user.id),
              eq(schema.logs.mediaItemId, mediaItemId)
            )
          )
          .limit(1);

        if (logs.length > 0) {
          userLog = {
            id: logs[0].id,
            status: logs[0].status,
            startedAt: logs[0].startedAt?.toISOString().split("T")[0] ?? null,
            finishedAt: logs[0].finishedAt?.toISOString().split("T")[0] ?? null,
            progress: logs[0].progress,
          };
        }

        // Fetch community stats
        const communityStats = await db
          .select({
            avgRating: sql<number>`AVG(NULLIF(${schema.ratings.score}, 0))::real`,
            ratingCount: sql<number>`COUNT(NULLIF(${schema.ratings.score}, 0))::int`,
          })
          .from(schema.ratings)
          .where(eq(schema.ratings.mediaItemId, mediaItemId));

        if (communityStats.length > 0) {
          ratingCount = communityStats[0].ratingCount ?? 0;
          avgRating = communityStats[0].avgRating
            ? Math.round(communityStats[0].avgRating * 10) / 10
            : null;
        }

        const reviewStats = await db
          .select({
            count: sql<number>`COUNT(*)::int`,
          })
          .from(schema.reviews)
          .where(eq(schema.reviews.mediaItemId, mediaItemId));

        reviewCount = reviewStats[0]?.count ?? 0;
      }
    }
  } catch {
    // Not authenticated or DB error — continue with defaults
  }

  return (
    <div>
      <MediaHero media={media} userRating={userRating} userLog={userLog} />
      <MediaInfo
        media={media}
        communityStats={{ ratingCount, avgRating, reviewCount }}
      />
    </div>
  );
}

export async function generateMetadata({ params }: MediaDetailPageProps) {
  const { type, id } = await params;
  const media = await getMediaDetails(id, type as MediaType);

  if (!media) {
    return { title: "Not Found — Almanack" };
  }

  return {
    title: `${media.title} — Almanack`,
    description: media.overview?.slice(0, 160) || `View ${media.title} on Almanack`,
  };
}
