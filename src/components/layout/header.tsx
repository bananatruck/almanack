"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, X, Bell } from "lucide-react";
import Avatar from "@/components/ui/avatar";
import { signOut } from "@/lib/auth-client";

interface HeaderProps {
  username?: string;
  displayName?: string;
  avatarUrl?: string | null;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export default function Header({
  username = "user",
  displayName = "User",
  avatarUrl,
  onToggleSidebar,
  sidebarOpen,
}: HeaderProps) {
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header
      className="
        fixed top-0 left-0 right-0 z-50
        h-[var(--header-height)] px-4 lg:px-6
        bg-[var(--bg-primary)]/80 backdrop-blur-xl
        border-b border-[var(--border-secondary)]
        flex items-center justify-between gap-4
      "
    >
      {/* Left: Menu toggle + Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="
            lg:hidden p-2 rounded-[var(--radius-md)]
            text-[var(--text-secondary)] hover:text-[var(--text-primary)]
            hover:bg-[var(--surface-glass)] transition-colors duration-150
          "
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link href="/home" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-lg font-bold text-[var(--text-primary)] hidden sm:block">
            Almanack
          </span>
        </Link>
      </div>

      {/* Center: Search bar */}
      <div className="flex-1 max-w-lg mx-4">
        <Link
          href="/search"
          className="
            flex items-center gap-2 w-full px-3.5 py-2
            bg-[var(--bg-tertiary)] rounded-[var(--radius-lg)]
            border border-[var(--border-primary)]
            text-[var(--text-muted)] text-sm
            hover:border-[var(--text-tertiary)] hover:text-[var(--text-tertiary)]
            transition-all duration-150
          "
        >
          <Search size={16} />
          <span>Search movies, shows, games, books...</span>
        </Link>
      </div>

      {/* Right: Notifications + User menu */}
      <div className="flex items-center gap-2">
        <button
          className="
            p-2 rounded-[var(--radius-md)]
            text-[var(--text-secondary)] hover:text-[var(--text-primary)]
            hover:bg-[var(--surface-glass)] transition-colors duration-150
            relative
          "
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--surface-glass)] transition-colors duration-150"
            aria-label="User menu"
          >
            <Avatar src={avatarUrl} name={displayName} size="sm" />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div
                className="
                  absolute right-0 top-full mt-2 z-50
                  w-56 py-2
                  bg-[var(--bg-elevated)] border border-[var(--border-primary)]
                  rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]
                "
              >
                <div className="px-4 py-2 border-b border-[var(--border-secondary)]">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {displayName}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    @{username}
                  </p>
                </div>
                <Link
                  href={`/profile/${username}`}
                  className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-glass)] hover:text-[var(--text-primary)] transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Your Profile
                </Link>
                <Link
                  href="/settings"
                  className="block px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-glass)] hover:text-[var(--text-primary)] transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Settings
                </Link>
                <div className="border-t border-[var(--border-secondary)] mt-1 pt-1">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-[var(--color-error)] hover:bg-[var(--color-error-muted)] transition-colors"
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await signOut();
                      router.push("/login");
                      router.refresh();
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
