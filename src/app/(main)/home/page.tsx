import { getTrendingMedia } from "@/lib/providers";
import MediaCarousel from "@/components/media/media-carousel";
import { Search, BookmarkPlus, Star } from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  // Fetch trending in parallel
  const [trendingMovies, trendingTV, trendingAnime] = await Promise.allSettled([
    getTrendingMedia("movie"),
    getTrendingMedia("tv_show"),
    getTrendingMedia("anime"),
  ]);

  return (
    <div className="animate-fade-in">
      {/* Welcome hero */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-2">
          Welcome to{" "}
          <span className="text-gradient">Almanack</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-base max-w-xl">
          Track, rate, and review everything you watch, read, play, and listen to.
          Build your media identity.
        </p>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3 mt-6">
          <Link
            href="/search"
            className="
              inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-lg)]
              bg-[var(--accent-primary)] text-[var(--accent-primary-text)]
              font-semibold text-sm
              hover:brightness-110 transition-all duration-150
              shadow-sm
            "
          >
            <Search size={16} />
            Search Media
          </Link>
          <button
            className="
              inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-lg)]
              bg-[var(--surface-glass)] text-[var(--text-primary)]
              border border-[var(--border-primary)]
              font-medium text-sm
              hover:bg-[var(--surface-glass-hover)] transition-all duration-150
            "
          >
            <BookmarkPlus size={16} />
            Quick Log
          </button>
        </div>
      </div>

      {/* Trending sections */}
      {trendingMovies.status === "fulfilled" && trendingMovies.value.length > 0 && (
        <MediaCarousel
          title="🎬 Trending Movies"
          items={trendingMovies.value}
          viewAllHref="/search?type=movie"
        />
      )}

      {trendingTV.status === "fulfilled" && trendingTV.value.length > 0 && (
        <MediaCarousel
          title="📺 Trending TV Shows"
          items={trendingTV.value}
          viewAllHref="/search?type=tv_show"
        />
      )}

      {trendingAnime.status === "fulfilled" && trendingAnime.value.length > 0 && (
        <MediaCarousel
          title="✨ Trending Anime"
          items={trendingAnime.value}
          viewAllHref="/search?type=anime"
        />
      )}

      {/* Placeholder sections for future phases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="glass p-6 rounded-[var(--radius-xl)]">
          <div className="flex items-center gap-2 mb-3">
            <Star size={18} className="text-[var(--accent-primary)]" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Recent Activity
            </h3>
          </div>
          <p className="text-sm text-[var(--text-tertiary)]">
            Your ratings, reviews, and logs will appear here.
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-3">
            Start by searching and rating something you&apos;ve watched or read.
          </p>
        </div>

        <div className="glass p-6 rounded-[var(--radius-xl)]">
          <div className="flex items-center gap-2 mb-3">
            <BookmarkPlus size={18} className="text-[var(--accent-secondary)]" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Continue Watching
            </h3>
          </div>
          <p className="text-sm text-[var(--text-tertiary)]">
            Media you&apos;re currently watching, reading, or playing will appear here.
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-3">
            Log something with a &ldquo;Watching&rdquo; status to get started.
          </p>
        </div>
      </div>
    </div>
  );
}
