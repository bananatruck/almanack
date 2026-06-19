import type { MediaType } from "@/config/constants";
import type { IMediaProvider, MediaSearchResult, MediaDetails } from "./types";
import { tmdbProvider } from "./tmdb";
import { anilistProvider } from "./anilist";

/**
 * Registry mapping media types to their provider adapter.
 */
const providerMap: Record<MediaType, IMediaProvider> = {
  movie: tmdbProvider,
  tv_show: tmdbProvider,
  animation: tmdbProvider,
  anime: anilistProvider,
  manga: anilistProvider,
  // Placeholders for future Phase 4 integrations
  book: tmdbProvider, // Will be replaced by Open Library
  game: tmdbProvider, // Will be replaced by IGDB
  comic: tmdbProvider, // Will be replaced by Comic Vine
  music: tmdbProvider, // Will be replaced by MusicBrainz
};

/**
 * Get the appropriate provider for a media type.
 */
export function getProvider(type: MediaType): IMediaProvider {
  return providerMap[type];
}

/**
 * Search across all providers (or a specific type).
 */
export async function searchMedia(
  query: string,
  type?: MediaType
): Promise<MediaSearchResult[]> {
  if (type) {
    const provider = getProvider(type);
    return provider.search(query, type);
  }

  // Search across TMDB (movies + TV) and AniList (anime + manga) in parallel
  const [tmdbResults, anilistResults] = await Promise.allSettled([
    tmdbProvider.search(query),
    anilistProvider.search(query, "anime"),
  ]);

  const results: MediaSearchResult[] = [];

  if (tmdbResults.status === "fulfilled") {
    results.push(...tmdbResults.value);
  }
  if (anilistResults.status === "fulfilled") {
    results.push(...anilistResults.value);
  }

  return results;
}

/**
 * Get details for a specific media item.
 */
export async function getMediaDetails(
  externalId: string,
  type: MediaType
): Promise<MediaDetails | null> {
  const provider = getProvider(type);
  return provider.getDetails(externalId, type);
}

/**
 * Get trending media for a specific type or across providers.
 */
export async function getTrendingMedia(
  type?: MediaType
): Promise<MediaSearchResult[]> {
  if (type) {
    const provider = getProvider(type);
    return provider.getTrending(type);
  }

  const [tmdbResults, anilistResults] = await Promise.allSettled([
    tmdbProvider.getTrending(),
    anilistProvider.getTrending("anime"),
  ]);

  const results: MediaSearchResult[] = [];

  if (tmdbResults.status === "fulfilled") {
    results.push(...tmdbResults.value.slice(0, 10));
  }
  if (anilistResults.status === "fulfilled") {
    results.push(...anilistResults.value.slice(0, 10));
  }

  return results;
}
