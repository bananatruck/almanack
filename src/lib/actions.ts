"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth";
import * as schema from "@/lib/db/schema";
import { getMediaDetails } from "@/lib/providers";
import type { MediaType } from "@/config/constants";

// ───────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

/**
 * Ensure a media item exists in our database.
 * If not found by external ID, fetch from the provider and create it.
 * Returns the internal media_items.id (UUID).
 */
export async function ensureMediaItem(
  externalId: string,
  type: MediaType,
  provider: string
): Promise<string> {
  // Look up by external ID in JSONB
  const externalKey = `${provider}_id`;
  const existing = await db
    .select({ id: schema.mediaItems.id })
    .from(schema.mediaItems)
    .where(
      sql`${schema.mediaItems.externalIds} ->> ${externalKey} = ${externalId}`
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Fetch details from the provider
  const details = await getMediaDetails(externalId, type);
  if (!details) {
    throw new Error(`Could not fetch media details for ${externalId}`);
  }

  const [inserted] = await db
    .insert(schema.mediaItems)
    .values({
      title: details.title,
      type,
      releaseDate: details.releaseDate,
      posterUrl: details.posterUrl,
      backdropUrl: details.backdropUrl,
      description: details.overview,
      avgRating: null,
      ratingCount: 0,
      externalIds: { [externalKey]: externalId },
      metadata: details.metadata,
    })
    .returning({ id: schema.mediaItems.id });

  return inserted.id;
}

// ───────────────────────────────────────────────────────────
// Rate Media
// ───────────────────────────────────────────────────────────

interface RateMediaInput {
  externalId: string;
  type: MediaType;
  provider: string;
  score: number; // 1–5
  isFavorite: boolean;
}

export async function rateMedia(input: RateMediaInput) {
  const user = await getSessionUser();
  const { externalId, type, provider, score, isFavorite } = input;

  if (score < 1 || score > 5) {
    throw new Error("Score must be between 1 and 5");
  }

  const mediaItemId = await ensureMediaItem(externalId, type, provider);

  // Upsert rating
  await db
    .insert(schema.ratings)
    .values({
      userId: user.id,
      mediaItemId,
      score,
      isFavorite,
    })
    .onConflictDoUpdate({
      target: [schema.ratings.userId, schema.ratings.mediaItemId],
      set: {
        score,
        isFavorite,
        updatedAt: new Date(),
      },
    });

  // Recalculate avg rating
  await recalculateRating(mediaItemId);

  revalidatePath(`/media/${type}/${externalId}`);
  return { success: true, mediaItemId };
}

// ───────────────────────────────────────────────────────────
// Toggle Favorite
// ───────────────────────────────────────────────────────────

interface ToggleFavoriteInput {
  externalId: string;
  type: MediaType;
  provider: string;
}

export async function toggleFavorite(input: ToggleFavoriteInput) {
  const user = await getSessionUser();
  const { externalId, type, provider } = input;

  const mediaItemId = await ensureMediaItem(externalId, type, provider);

  // Check if rating exists
  const existingRating = await db
    .select()
    .from(schema.ratings)
    .where(
      and(
        eq(schema.ratings.userId, user.id),
        eq(schema.ratings.mediaItemId, mediaItemId)
      )
    )
    .limit(1);

  if (existingRating.length > 0) {
    // Toggle isFavorite
    const newFavorite = !existingRating[0].isFavorite;
    await db
      .update(schema.ratings)
      .set({ isFavorite: newFavorite, updatedAt: new Date() })
      .where(eq(schema.ratings.id, existingRating[0].id));

    revalidatePath(`/media/${type}/${externalId}`);
    return { success: true, isFavorite: newFavorite };
  }

  // No rating yet — create a "favorite-only" entry with minimum score
  await db.insert(schema.ratings).values({
    userId: user.id,
    mediaItemId,
    score: 0,
    isFavorite: true,
  });

  revalidatePath(`/media/${type}/${externalId}`);
  return { success: true, isFavorite: true };
}

// ───────────────────────────────────────────────────────────
// Log Media
// ───────────────────────────────────────────────────────────

interface LogMediaInput {
  externalId: string;
  type: MediaType;
  provider: string;
  status: (typeof schema.logStatusEnum.enumValues)[number];
  startedAt?: string | null;
  finishedAt?: string | null;
  progress?: number | null;
  categoryMetadata?: Record<string, unknown> | null;
}

export async function logMedia(input: LogMediaInput) {
  const user = await getSessionUser();
  const {
    externalId,
    type,
    provider,
    status,
    startedAt,
    finishedAt,
    progress,
    categoryMetadata,
  } = input;

  const mediaItemId = await ensureMediaItem(externalId, type, provider);

  await db
    .insert(schema.logs)
    .values({
      userId: user.id,
      mediaItemId,
      status,
      startedAt: startedAt ? new Date(startedAt) : null,
      finishedAt: finishedAt ? new Date(finishedAt) : null,
      progress: progress ?? null,
      categoryMetadata: categoryMetadata ?? null,
    })
    .onConflictDoUpdate({
      target: [schema.logs.userId, schema.logs.mediaItemId],
      set: {
        status,
        startedAt: startedAt ? new Date(startedAt) : null,
        finishedAt: finishedAt ? new Date(finishedAt) : null,
        progress: progress ?? null,
        categoryMetadata: categoryMetadata ?? null,
        updatedAt: new Date(),
      },
    });

  revalidatePath(`/media/${type}/${externalId}`);
  return { success: true };
}

// ───────────────────────────────────────────────────────────
// Remove Log
// ───────────────────────────────────────────────────────────

export async function removeLog(logId: string, mediaPath: string) {
  const user = await getSessionUser();

  // Verify ownership
  const log = await db
    .select()
    .from(schema.logs)
    .where(and(eq(schema.logs.id, logId), eq(schema.logs.userId, user.id)))
    .limit(1);

  if (log.length === 0) {
    throw new Error("Log not found or unauthorized");
  }

  await db.delete(schema.logs).where(eq(schema.logs.id, logId));
  revalidatePath(mediaPath);
  return { success: true };
}

// ───────────────────────────────────────────────────────────
// Remove Rating
// ───────────────────────────────────────────────────────────

export async function removeRating(ratingId: string, mediaPath: string) {
  const user = await getSessionUser();

  // Verify ownership and get mediaItemId for recalc
  const rating = await db
    .select()
    .from(schema.ratings)
    .where(
      and(eq(schema.ratings.id, ratingId), eq(schema.ratings.userId, user.id))
    )
    .limit(1);

  if (rating.length === 0) {
    throw new Error("Rating not found or unauthorized");
  }

  const mediaItemId = rating[0].mediaItemId;
  await db.delete(schema.ratings).where(eq(schema.ratings.id, ratingId));
  await recalculateRating(mediaItemId);

  revalidatePath(mediaPath);
  return { success: true };
}

// ───────────────────────────────────────────────────────────
// Internal Helpers
// ───────────────────────────────────────────────────────────

async function recalculateRating(mediaItemId: string) {
  const result = await db
    .select({
      avgRating: sql<number>`AVG(NULLIF(${schema.ratings.score}, 0))::real`,
      ratingCount: sql<number>`COUNT(NULLIF(${schema.ratings.score}, 0))::int`,
    })
    .from(schema.ratings)
    .where(eq(schema.ratings.mediaItemId, mediaItemId));

  const { avgRating, ratingCount } = result[0] ?? {
    avgRating: null,
    ratingCount: 0,
  };

  await db
    .update(schema.mediaItems)
    .set({
      avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      ratingCount: ratingCount ?? 0,
      updatedAt: new Date(),
    })
    .where(eq(schema.mediaItems.id, mediaItemId));
}
