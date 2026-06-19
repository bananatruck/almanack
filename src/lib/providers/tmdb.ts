import type { MediaType } from "@/config/constants";
import {
  TMDB_IMAGE_BASE,
  TMDB_POSTER_SIZES,
  TMDB_BACKDROP_SIZES,
} from "@/config/constants";
import type {
  IMediaProvider,
  MediaSearchResult,
  MediaDetails,
} from "./types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  overview: string;
  vote_average: number;
  media_type?: string;
  genre_ids: number[];
}

interface TMDBDetails {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  overview: string;
  vote_average: number;
  genres: { id: number; name: string }[];
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  tagline?: string;
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
    crew: { id: number; name: string; job: string }[];
  };
}

function posterUrl(path: string | null): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${TMDB_POSTER_SIZES.medium}${path}`;
}

function backdropUrl(path: string | null): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${TMDB_BACKDROP_SIZES.large}${path}`;
}

/**
 * Convert TMDB 0-10 rating to our 0-5 scale.
 */
function normalizeRating(tmdbRating: number): number | null {
  if (!tmdbRating) return null;
  return Math.round((tmdbRating / 2) * 10) / 10;
}

function mapTmdbType(tmdbType: string | undefined, fallback: MediaType): MediaType {
  if (tmdbType === "movie") return "movie";
  if (tmdbType === "tv") return "tv_show";
  return fallback;
}

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY is not set");
  }

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", apiKey);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const tmdbProvider: IMediaProvider = {
  name: "tmdb",
  supportedTypes: ["movie", "tv_show", "animation"],

  async search(query: string, type?: MediaType): Promise<MediaSearchResult[]> {
    if (type === "movie") {
      const data = await tmdbFetch<{ results: TMDBSearchResult[] }>("/search/movie", {
        query,
        include_adult: "false",
      });
      return data.results.slice(0, 20).map((item) => ({
        externalId: String(item.id),
        title: item.title || item.name || "Unknown",
        type: "movie" as MediaType,
        posterUrl: posterUrl(item.poster_path),
        releaseDate: item.release_date || null,
        overview: item.overview || null,
        rating: normalizeRating(item.vote_average),
        provider: "tmdb",
      }));
    }

    if (type === "tv_show" || type === "animation") {
      const data = await tmdbFetch<{ results: TMDBSearchResult[] }>("/search/tv", {
        query,
        include_adult: "false",
      });
      return data.results.slice(0, 20).map((item) => ({
        externalId: String(item.id),
        title: item.name || item.title || "Unknown",
        type: (type || "tv_show") as MediaType,
        posterUrl: posterUrl(item.poster_path),
        releaseDate: item.first_air_date || null,
        overview: item.overview || null,
        rating: normalizeRating(item.vote_average),
        provider: "tmdb",
      }));
    }

    // Multi-search (default)
    const data = await tmdbFetch<{ results: TMDBSearchResult[] }>("/search/multi", {
      query,
      include_adult: "false",
    });

    return data.results
      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
      .slice(0, 20)
      .map((item) => ({
        externalId: String(item.id),
        title: item.title || item.name || "Unknown",
        type: mapTmdbType(item.media_type, "movie"),
        posterUrl: posterUrl(item.poster_path),
        releaseDate: item.release_date || item.first_air_date || null,
        overview: item.overview || null,
        rating: normalizeRating(item.vote_average),
        provider: "tmdb",
      }));
  },

  async getDetails(externalId: string, type: MediaType): Promise<MediaDetails | null> {
    const endpoint = type === "movie" ? `/movie/${externalId}` : `/tv/${externalId}`;

    try {
      const data = await tmdbFetch<TMDBDetails>(endpoint, {
        append_to_response: "credits",
      });

      const director = data.credits?.crew?.find((c) => c.job === "Director")?.name;
      const cast = data.credits?.cast?.slice(0, 10).map((c) => ({
        name: c.name,
        character: c.character,
      }));

      return {
        externalId: String(data.id),
        title: data.title || data.name || "Unknown",
        type,
        posterUrl: posterUrl(data.poster_path),
        backdropUrl: backdropUrl(data.backdrop_path),
        releaseDate: data.release_date || data.first_air_date || null,
        overview: data.overview || null,
        rating: normalizeRating(data.vote_average),
        genres: data.genres.map((g) => g.name),
        metadata: {
          tmdb_id: data.id,
          runtime: data.runtime,
          number_of_seasons: data.number_of_seasons,
          number_of_episodes: data.number_of_episodes,
          status: data.status,
          tagline: data.tagline,
          director,
          cast,
        },
        provider: "tmdb",
      };
    } catch {
      return null;
    }
  },

  async getTrending(type?: MediaType): Promise<MediaSearchResult[]> {
    const mediaType = type === "movie" ? "movie" : type === "tv_show" || type === "animation" ? "tv" : "all";
    const data = await tmdbFetch<{ results: TMDBSearchResult[] }>(
      `/trending/${mediaType}/week`
    );

    return data.results
      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
      .slice(0, 20)
      .map((item) => ({
        externalId: String(item.id),
        title: item.title || item.name || "Unknown",
        type: mapTmdbType(item.media_type, "movie"),
        posterUrl: posterUrl(item.poster_path),
        releaseDate: item.release_date || item.first_air_date || null,
        overview: item.overview || null,
        rating: normalizeRating(item.vote_average),
        provider: "tmdb",
      }));
  },
};
