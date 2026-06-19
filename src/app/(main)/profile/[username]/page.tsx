import ProfileHeader from "@/components/profile/profile-header";
import ProfileTabs from "@/components/profile/profile-tabs";
import ProfileStats from "@/components/profile/profile-stats";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  // Dummy profile data for Phase 1
  const profile = {
    username,
    displayName: username.charAt(0).toUpperCase() + username.slice(1),
    avatarUrl: null,
    bio: "Just getting started on Almanack. Tracking everything I watch, read, play, and listen to.",
    joinDate: new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    isOwnProfile: true,
    followerCount: 0,
    followingCount: 0,
  };

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Favorite media */}
            <div className="glass p-6">
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
                Favorite Media
              </h3>
              <div className="flex items-center justify-center py-8 text-center">
                <div>
                  <span className="text-4xl mb-3 block">💫</span>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    No favorites yet
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Mark media as favorite when rating to see them here
                  </p>
                </div>
              </div>
            </div>

            {/* Recent activity */}
            <div className="glass p-6">
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
                Recent Activity
              </h3>
              <div className="flex items-center justify-center py-8 text-center">
                <div>
                  <span className="text-4xl mb-3 block">📝</span>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    No activity yet
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Rate, log, or review something to start building your history
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats sidebar */}
          <div>
            <ProfileStats
              totalRated={0}
              totalLogged={0}
              totalReviewed={0}
            />
          </div>
        </div>
      ),
    },
    {
      id: "ratings",
      label: "Ratings",
      content: (
        <div className="flex items-center justify-center py-16 text-center">
          <div>
            <span className="text-5xl mb-4 block">⭐</span>
            <p className="text-[var(--text-secondary)] text-lg font-medium">
              No ratings yet
            </p>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">
              Ratings will appear here once you start scoring media
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "reviews",
      label: "Reviews",
      content: (
        <div className="flex items-center justify-center py-16 text-center">
          <div>
            <span className="text-5xl mb-4 block">✍️</span>
            <p className="text-[var(--text-secondary)] text-lg font-medium">
              No reviews yet
            </p>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">
              Your reviews will appear here
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "lists",
      label: "Lists",
      content: (
        <div className="flex items-center justify-center py-16 text-center">
          <div>
            <span className="text-5xl mb-4 block">📋</span>
            <p className="text-[var(--text-secondary)] text-lg font-medium">
              No lists yet
            </p>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">
              Create lists to organize and share your taste
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "activity",
      label: "Activity",
      content: (
        <div className="flex items-center justify-center py-16 text-center">
          <div>
            <span className="text-5xl mb-4 block">📊</span>
            <p className="text-[var(--text-secondary)] text-lg font-medium">
              No activity yet
            </p>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">
              Your media journey will be tracked here
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <ProfileHeader {...profile} />
      <ProfileTabs tabs={tabs} defaultTab="overview" />
    </div>
  );
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { username } = await params;
  return {
    title: `@${username} — Almanack`,
    description: `View ${username}'s media profile on Almanack`,
  };
}
