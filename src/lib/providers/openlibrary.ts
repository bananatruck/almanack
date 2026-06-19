import type { MediaType } from "@/config/constants";
import type {
  IMediaProvider,
  MediaSearchResult,
  MediaDetails,
} from "./types";

const OL_SEARCH_URL = "https://openlibrary.org/search.json";
const OL_COVERS_URL = "https://covers.openlibrary.org/b/id";

interface OLSearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  number_of_pages_median?: number;
  subject?: string[];
  isbn?: string[];
  ratings_average?: number;
  ratings_count?: number;
}

interface OLWorkDetails {
  key: string;
  title: string;
  description?: string | { value: string };
  covers?: number[];
  subjects?: string[];
  authors?: { author: { key: string } }[];
  first_publish_date?: string;
}

interface OLAuthor {
  name: string;
  bio?: string | { value: string };
}

function coverUrl(coverId: number | undefined, size: "S" | "M" | "L" = "M"): string | null {
  if (!coverId) return null;
  return `${OL_COVERS_URL}/${coverId}-${size}.jpg`;
}

function normalizeRating(rating: number | undefined): number | null {
  if (!rating) return null;
  // Open Library uses 1-5 scale already
  return Math.round(rating * 10) / 10;
}

function extractDescription(desc: string | { value: string } | undefined): string | null {
  if (!desc) return null;
  if (typeof desc === "string") return desc;
  return desc.value || null;
}

async function olFetch<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Almanack/1.0 (media-tracker-app)",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Open Library API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const openLibraryProvider: IMediaProvider = {
  name: "openlibrary",
  supportedTypes: ["book"],

  async search(query: string): Promise<MediaSearchResult[]> {
    const params = new URLSearchParams({
      q: query,
      limit: "20",
      fields: "key,title,author_name,first_publish_year,cover_i,ratings_average,isbn",
    });

    const data = await olFetch<{ docs: OLSearchDoc[] }>(
      `${OL_SEARCH_URL}?${params}`
    );

    return data.docs.slice(0, 20).map((doc) => {
      // Extract work ID from key like "/works/OL12345W"
      const workId = doc.key.replace("/works/", "");
      return {
        externalId: workId,
        title: doc.title,
        type: "book" as MediaType,
        posterUrl: coverUrl(doc.cover_i),
        releaseDate: doc.first_publish_year ? `${doc.first_publish_year}-01-01` : null,
        overview: doc.author_name ? `by ${doc.author_name.join(", ")}` : null,
        rating: normalizeRating(doc.ratings_average),
        provider: "openlibrary",
      };
    });
  },

  async getDetails(externalId: string): Promise<MediaDetails | null> {
    try {
      const work = await olFetch<OLWorkDetails>(
        `https://openlibrary.org/works/${externalId}.json`
      );

      // Fetch author names
      let authorNames: string[] = [];
      if (work.authors && work.authors.length > 0) {
        const authorPromises = work.authors.slice(0, 5).map(async (a) => {
          try {
            const author = await olFetch<OLAuthor>(
              `https://openlibrary.org${a.author.key}.json`
            );
            return author.name;
          } catch {
            return null;
          }
        });
        const results = await Promise.allSettled(authorPromises);
        authorNames = results
          .filter((r): r is PromiseFulfilledResult<string | null> => r.status === "fulfilled")
          .map((r) => r.value)
          .filter((n): n is string => n !== null);
      }

      return {
        externalId,
        title: work.title,
        type: "book",
        posterUrl: coverUrl(work.covers?.[0], "L"),
        backdropUrl: null,
        releaseDate: work.first_publish_date || null,
        overview: extractDescription(work.description),
        rating: null,
        genres: (work.subjects || []).slice(0, 10),
        metadata: {
          openlibrary_id: externalId,
          authors: authorNames,
        },
        provider: "openlibrary",
      };
    } catch {
      return null;
    }
  },

  async getTrending(): Promise<MediaSearchResult[]> {
    // Open Library doesn't have a trending endpoint, so we search for popular recent books
    try {
      const params = new URLSearchParams({
        q: "subject:fiction",
        sort: "rating",
        limit: "20",
        fields: "key,title,author_name,first_publish_year,cover_i,ratings_average",
      });

      const data = await olFetch<{ docs: OLSearchDoc[] }>(
        `${OL_SEARCH_URL}?${params}`
      );

      return data.docs.slice(0, 20).map((doc) => {
        const workId = doc.key.replace("/works/", "");
        return {
          externalId: workId,
          title: doc.title,
          type: "book" as MediaType,
          posterUrl: coverUrl(doc.cover_i),
          releaseDate: doc.first_publish_year ? `${doc.first_publish_year}-01-01` : null,
          overview: doc.author_name ? `by ${doc.author_name.join(", ")}` : null,
          rating: normalizeRating(doc.ratings_average),
          provider: "openlibrary",
        };
      });
    } catch {
      return [];
    }
  },
};
