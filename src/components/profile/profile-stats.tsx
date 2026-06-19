import {
  Film,
  Tv,
  BookOpen,
  Gamepad2,
  Music,
  Sparkles,
  Image as ImageIcon,
  BookMarked,
  Palette,
} from "lucide-react";

interface StatItem {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

const categories: StatItem[] = [
  { icon: <Film size={16} />, label: "Movies", value: 0, color: "var(--color-movie)" },
  { icon: <Tv size={16} />, label: "TV Shows", value: 0, color: "var(--color-tv-show)" },
  { icon: <Sparkles size={16} />, label: "Anime", value: 0, color: "var(--color-anime)" },
  { icon: <BookOpen size={16} />, label: "Manga", value: 0, color: "var(--color-manga)" },
  { icon: <Gamepad2 size={16} />, label: "Games", value: 0, color: "var(--color-game)" },
  { icon: <Music size={16} />, label: "Music", value: 0, color: "var(--color-music)" },
  { icon: <BookMarked size={16} />, label: "Books", value: 0, color: "var(--color-book)" },
  { icon: <Palette size={16} />, label: "Comics", value: 0, color: "var(--color-comic)" },
  { icon: <ImageIcon size={16} />, label: "Animation", value: 0, color: "var(--color-animation)" },
];

interface ProfileStatsProps {
  totalRated: number;
  totalLogged: number;
  totalReviewed: number;
}

export default function ProfileStats({
  totalRated,
  totalLogged,
  totalReviewed,
}: ProfileStatsProps) {
  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass p-4 text-center">
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {totalRated}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Rated</p>
        </div>
        <div className="glass p-4 text-center">
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {totalLogged}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Logged</p>
        </div>
        <div className="glass p-4 text-center">
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {totalReviewed}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Reviewed</p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="glass p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Media Breakdown
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => (
            <div
              key={cat.label}
              className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)]"
            >
              <span style={{ color: cat.color }}>{cat.icon}</span>
              <span className="text-xs text-[var(--text-tertiary)]">
                {cat.label}
              </span>
              <span className="text-xs font-medium text-[var(--text-secondary)] ml-auto">
                {cat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap placeholder */}
      <div className="glass p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Activity
        </h3>
        <div className="grid grid-cols-[repeat(52,1fr)] gap-[2px]">
          {Array.from({ length: 364 }, (_, i) => (
            <div
              key={i}
              className="aspect-square rounded-[1px]"
              style={{
                backgroundColor:
                  Math.random() > 0.85
                    ? `color-mix(in srgb, var(--accent-primary) ${Math.floor(Math.random() * 60 + 20)}%, transparent)`
                    : "var(--bg-tertiary)",
              }}
            />
          ))}
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-2 text-right">
          Activity heatmap — coming soon
        </p>
      </div>
    </div>
  );
}
