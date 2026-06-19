"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Library,
  List,
  User,
  Film,
  Tv,
  BookOpen,
  Gamepad2,
  Music,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  username?: string;
}

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Library", icon: Library },
  { href: "/lists", label: "Lists", icon: List },
];

const categoryItems = [
  { href: "/search?type=movie", label: "Movies", icon: Film },
  { href: "/search?type=tv_show", label: "TV Shows", icon: Tv },
  { href: "/search?type=anime", label: "Anime", icon: Sparkles },
  { href: "/search?type=manga", label: "Manga", icon: BookOpen },
  { href: "/search?type=game", label: "Games", icon: Gamepad2 },
  { href: "/search?type=music", label: "Music", icon: Music },
];

export default function Sidebar({ open, onClose, username }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-[var(--header-height)] left-0 bottom-0 z-40
          w-[var(--sidebar-width)] bg-[var(--bg-secondary)]
          border-r border-[var(--border-secondary)]
          flex flex-col py-4 overflow-y-auto
          transition-transform duration-300 ease-out
          lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Main navigation */}
        <nav className="flex flex-col gap-0.5 px-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)]
                  text-sm font-medium transition-all duration-150
                  ${
                    isActive
                      ? "bg-[var(--accent-primary-muted)] text-[var(--accent-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-glass)] hover:text-[var(--text-primary)]"
                  }
                `}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}

          {/* Profile link */}
          <Link
            href={`/profile/${username || "me"}`}
            onClick={onClose}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)]
              text-sm font-medium transition-all duration-150
              ${
                pathname.startsWith("/profile")
                  ? "bg-[var(--accent-primary-muted)] text-[var(--accent-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-glass)] hover:text-[var(--text-primary)]"
              }
            `}
          >
            <User size={18} />
            Profile
          </Link>
        </nav>

        {/* Divider */}
        <div className="mx-4 my-4 border-t border-[var(--border-secondary)]" />

        {/* Categories */}
        <div className="px-3">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Browse
          </p>
          <nav className="flex flex-col gap-0.5">
            {categoryItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="
                  flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)]
                  text-sm text-[var(--text-tertiary)]
                  hover:bg-[var(--surface-glass)] hover:text-[var(--text-secondary)]
                  transition-all duration-150
                "
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
