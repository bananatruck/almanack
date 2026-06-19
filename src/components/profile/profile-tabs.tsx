"use client";

import { useState, type ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface ProfileTabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

export default function ProfileTabs({ tabs, defaultTab }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const currentTab = tabs.find((t) => t.id === activeTab);

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-[var(--border-secondary)] mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-3 text-sm font-medium whitespace-nowrap
              transition-all duration-150 relative
              ${
                activeTab === tab.id
                  ? "text-[var(--accent-primary)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in" key={activeTab}>
        {currentTab?.content}
      </div>
    </div>
  );
}
