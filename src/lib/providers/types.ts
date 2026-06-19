import type { MediaType } from "@/config/constants";

/**
 * Normalized search result returned by all media providers.
 */
export interface MediaSearchResult {
  externalId: string;
  title: string;
  type: MediaType;
  posterUrl: string | null;
  releaseDate: string | null;
  overview: string | null;
  rating: number | null;
  provider: string;
}

/**
 * Full media details returned by a provider.
 */
export interface MediaDetails {
  externalId: string;
  title: string;
  type: MediaType;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  overview: string | null;
  rating: number | null;
  genres: string[];
  metadata: Record<string, unknown>;
  provider: string;
}

/**
 * Interface that all media provider adapters must implement.
 */
export interface IMediaProvider {
  readonly name: string;
  readonly supportedTypes: MediaType[];

  search(query: string, type?: MediaType): Promise<MediaSearchResult[]>;
  getDetails(externalId: string, type: MediaType): Promise<MediaDetails | null>;
  getTrending(type?: MediaType): Promise<MediaSearchResult[]>;
}
