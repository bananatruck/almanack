export const MEDIA_TYPES = {
  MOVIE: "movie",
  TV_SHOW: "tv_show",
  BOOK: "book",
  GAME: "game",
  MANGA: "manga",
  COMIC: "comic",
  ANIME: "anime",
  ANIMATION: "animation",
  MUSIC: "music",
} as const;

export type MediaType = (typeof MEDIA_TYPES)[keyof typeof MEDIA_TYPES];

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  movie: "Movie",
  tv_show: "TV Show",
  book: "Book",
  game: "Game",
  manga: "Manga",
  comic: "Comic",
  anime: "Anime",
  animation: "Animation",
  music: "Music",
};

export const MEDIA_TYPE_COLORS: Record<MediaType, string> = {
  movie: "var(--color-movie)",
  tv_show: "var(--color-tv-show)",
  book: "var(--color-book)",
  game: "var(--color-game)",
  manga: "var(--color-manga)",
  comic: "var(--color-comic)",
  anime: "var(--color-anime)",
  animation: "var(--color-animation)",
  music: "var(--color-music)",
};

export const LOG_STATUSES = {
  PLANNING: "planning",
  WATCHING: "watching",
  READING: "reading",
  PLAYING: "playing",
  LISTENING: "listening",
  COMPLETED: "completed",
  DROPPED: "dropped",
  PAUSED: "paused",
  REWATCHING: "rewatching",
} as const;

export type LogStatus = (typeof LOG_STATUSES)[keyof typeof LOG_STATUSES];

export const REVIEW_VISIBILITY = {
  PUBLIC: "public",
  PRIVATE: "private",
  FOLLOWERS_ONLY: "followers_only",
} as const;

export type ReviewVisibility =
  (typeof REVIEW_VISIBILITY)[keyof typeof REVIEW_VISIBILITY];

export const APP_CONFIG = {
  name: "Almanack",
  description: "Your media identity, beautifully organized.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  maxRating: 5,
  minRating: 1,
} as const;

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
export const TMDB_POSTER_SIZES = {
  small: "w185",
  medium: "w342",
  large: "w500",
  original: "original",
} as const;
export const TMDB_BACKDROP_SIZES = {
  small: "w780",
  large: "w1280",
  original: "original",
} as const;
