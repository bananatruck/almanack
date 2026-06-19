"use client";

import { useState, type ReactNode } from "react";
import Header from "./header";
import Sidebar from "./sidebar";

interface AppShellProps {
  children: ReactNode;
  username?: string;
  displayName?: string;
  avatarUrl?: string | null;
}

export default function AppShell({
  children,
  username,
  displayName,
  avatarUrl,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header
        username={username}
        displayName={displayName}
        avatarUrl={avatarUrl}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        username={username}
      />
      <main
        className="
          pt-[var(--header-height)]
          lg:pl-[var(--sidebar-width)]
          min-h-screen
        "
      >
        <div className="p-4 lg:p-6 max-w-[var(--max-content-width)] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
