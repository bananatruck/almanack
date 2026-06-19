"use client";

import { useState, useEffect, useCallback } from "react";
import { Search as SearchIcon } from "lucide-react";
import type { MediaSearchResult } from "@/lib/providers/types";
import type { MediaType } from "@/config/constants";
import { MEDIA_TYPE_LABELS } from "@/config/constants";
import MediaGrid from "@/components/media/media-grid";
import { SkeletonMediaGrid } from "@/components/ui/skeleton";

const SEARCH_TABS: { label: string; value: MediaType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Movies", value: "movie" },
  { label: "TV Shows", value: "tv_show" },
  { label: "Anime", value: "anime" },
  { label: "Manga", value: "manga" },
  { label: "Animation", value: "animation" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<MediaType | "all">("all");
  const [results, setResults] = useState<MediaSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const performSearch = useCallback(async (q: string, type: MediaType | "all") => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams({ q: q.trim() });
      if (type !== "all") params.set("type", type);

      const response = await fetch(`/api/media/search?${params}`);
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, activeTab);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeTab, performSearch]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Search header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6">
          Search
        </h1>

        {/* Search input */}
        <div className="relative">
          <SearchIcon
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for movies, shows, anime, manga, games..."
            className="
              w-full pl-12 pr-4 py-3.5 rounded-[var(--radius-xl)]
              bg-[var(--bg-tertiary)] border border-[var(--border-primary)]
              text-[var(--text-primary)] text-base
              placeholder:text-[var(--text-muted)]
              focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent
              transition-all duration-150
            "
            autoFocus
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
          {SEARCH_TABS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`
                px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium
                whitespace-nowrap transition-all duration-150
                ${
                  activeTab === value
                    ? "bg-[var(--accent-primary)] text-[var(--accent-primary-text)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-glass)] hover:text-[var(--text-primary)]"
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <SkeletonMediaGrid count={10} />
      ) : searched ? (
        <MediaGrid items={results} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SearchIcon size={48} className="text-[var(--text-muted)] mb-4" />
          <p className="text-[var(--text-secondary)] text-lg font-medium">
            Discover your next obsession
          </p>
          <p className="text-[var(--text-tertiary)] text-sm mt-1">
            Search across movies, TV shows, anime, manga, and more
          </p>
        </div>
      )}
    </div>
  );
}
