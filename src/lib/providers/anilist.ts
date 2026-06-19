import type { MediaType } from "@/config/constants";
import type {
  IMediaProvider,
  MediaSearchResult,
  MediaDetails,
} from "./types";

const ANILIST_URL = "https://graphql.anilist.co";

interface AniListMedia {
  id: number;
  title: { romaji: string; english: string | null; native: string | null };
  coverImage: { large: string | null; extraLarge: string | null };
  bannerImage: string | null;
  description: string | null;
  averageScore: number | null;
  meanScore: number | null;
  genres: string[];
  format: string;
  status: string;
  episodes: number | null;
  chapters: number | null;
  volumes: number | null;
  startDate: { year: number | null; month: number | null; day: number | null };
  season: string | null;
  seasonYear: number | null;
  studios: { nodes: { name: string }[] };
  staff: { edges: { node: { name: { full: string } }; role: string }[] };
}

const SEARCH_QUERY = `
  query ($search: String, $type: MediaType, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(search: $search, type: $type, sort: POPULARITY_DESC) {
        id
        title { romaji english native }
        coverImage { large extraLarge }
        bannerImage
        description
        averageScore
        genres
        format
        status
        episodes
        chapters
        volumes
        startDate { year month day }
        season
        seasonYear
      }
    }
  }
`;

const DETAILS_QUERY = `
  query ($id: Int) {
    Media(id: $id) {
      id
      title { romaji english native }
      coverImage { large extraLarge }
      bannerImage
      description
      averageScore
      meanScore
      genres
      format
      status
      episodes
      chapters
      volumes
      startDate { year month day }
      season
      seasonYear
      studios(isMain: true) { nodes { name } }
      staff(sort: RELEVANCE, perPage: 10) {
        edges { node { name { full } } role }
      }
    }
  }
`;

const TRENDING_QUERY = `
  query ($type: MediaType, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: $type, sort: TRENDING_DESC) {
        id
        title { romaji english native }
        coverImage { large extraLarge }
        bannerImage
        description
        averageScore
        genres
        format
        status
        episodes
        chapters
        volumes
        startDate { year month day }
        season
        seasonYear
      }
    }
  }
`;

function mapAniListType(type?: MediaType): "ANIME" | "MANGA" {
  if (type === "manga") return "MANGA";
  return "ANIME";
}

function mapToMediaType(format: string, requestedType?: MediaType): MediaType {
  if (requestedType) return requestedType;
  const animeFormats = ["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"];
  if (animeFormats.includes(format)) return "anime";
  return "manga";
}

function normalizeRating(score: number | null): number | null {
  if (!score) return null;
  return Math.round((score / 20) * 10) / 10; // 0-100 → 0-5
}

function formatDate(date: { year: number | null; month: number | null; day: number | null }): string | null {
  if (!date.year) return null;
  const month = date.month ? String(date.month).padStart(2, "0") : "01";
  const day = date.day ? String(date.day).padStart(2, "0") : "01";
  return `${date.year}-${month}-${day}`;
}

function getTitle(title: AniListMedia["title"]): string {
  return title.english || title.romaji || title.native || "Unknown";
}

function stripHtml(html: string | null): string | null {
  if (!html) return null;
  return html.replace(/<[^>]*>/g, "").trim();
}

async function anilistFetch<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return json.data;
}

function mapResult(media: AniListMedia, type?: MediaType): MediaSearchResult {
  return {
    externalId: String(media.id),
    title: getTitle(media.title),
    type: mapToMediaType(media.format, type),
    posterUrl: media.coverImage?.extraLarge || media.coverImage?.large || null,
    releaseDate: formatDate(media.startDate),
    overview: stripHtml(media.description),
    rating: normalizeRating(media.averageScore),
    provider: "anilist",
  };
}

export const anilistProvider: IMediaProvider = {
  name: "anilist",
  supportedTypes: ["anime", "manga"],

  async search(query: string, type?: MediaType): Promise<MediaSearchResult[]> {
    const anilistType = mapAniListType(type);

    const data = await anilistFetch<{ Page: { media: AniListMedia[] } }>(
      SEARCH_QUERY,
      { search: query, type: anilistType, page: 1, perPage: 20 }
    );

    return data.Page.media.map((media) => mapResult(media, type));
  },

  async getDetails(externalId: string, type: MediaType): Promise<MediaDetails | null> {
    try {
      const data = await anilistFetch<{ Media: AniListMedia }>(
        DETAILS_QUERY,
        { id: parseInt(externalId) }
      );

      const media = data.Media;
      const studio = media.studios?.nodes?.[0]?.name;
      const directors = media.staff?.edges
        ?.filter((e) => e.role === "Director")
        .map((e) => e.node.name.full);

      return {
        externalId: String(media.id),
        title: getTitle(media.title),
        type: mapToMediaType(media.format, type),
        posterUrl: media.coverImage?.extraLarge || media.coverImage?.large || null,
        backdropUrl: media.bannerImage || null,
        releaseDate: formatDate(media.startDate),
        overview: stripHtml(media.description),
        rating: normalizeRating(media.averageScore),
        genres: media.genres || [],
        metadata: {
          anilist_id: media.id,
          format: media.format,
          status: media.status,
          episodes: media.episodes,
          chapters: media.chapters,
          volumes: media.volumes,
          season: media.season,
          seasonYear: media.seasonYear,
          studio,
          directors,
          title_romaji: media.title.romaji,
          title_native: media.title.native,
        },
        provider: "anilist",
      };
    } catch {
      return null;
    }
  },

  async getTrending(type?: MediaType): Promise<MediaSearchResult[]> {
    const anilistType = mapAniListType(type);

    const data = await anilistFetch<{ Page: { media: AniListMedia[] } }>(
      TRENDING_QUERY,
      { type: anilistType, page: 1, perPage: 20 }
    );

    return data.Page.media.map((media) => mapResult(media, type));
  },
};
