import Avatar from "@/components/ui/avatar";
import Button from "@/components/ui/button";
import { Settings, UserPlus } from "lucide-react";

interface ProfileHeaderProps {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  joinDate: string;
  isOwnProfile: boolean;
  followerCount: number;
  followingCount: number;
}

export default function ProfileHeader({
  username,
  displayName,
  avatarUrl,
  bio,
  joinDate,
  isOwnProfile,
  followerCount,
  followingCount,
}: ProfileHeaderProps) {
  return (
    <div className="mb-8">
      {/* Banner */}
      <div className="relative h-[160px] sm:h-[200px] -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 mb-0 overflow-hidden rounded-b-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/30 via-[var(--accent-secondary)]/20 to-[var(--bg-tertiary)]" />
        <div className="absolute inset-0 bg-[var(--bg-primary)]/40" />
      </div>

      {/* Profile info */}
      <div className="relative px-4 lg:px-0 -mt-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          {/* Avatar */}
          <div className="shrink-0 ring-4 ring-[var(--bg-primary)] rounded-full">
            <Avatar
              src={avatarUrl}
              name={displayName}
              size="xl"
            />
          </div>

          {/* Name + actions */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                {displayName}
              </h1>
              <p className="text-sm text-[var(--text-tertiary)]">@{username}</p>
            </div>

            <div className="flex gap-2">
              {isOwnProfile ? (
                <Button variant="secondary" size="sm">
                  <Settings size={14} />
                  Edit Profile
                </Button>
              ) : (
                <Button size="sm">
                  <UserPlus size={14} />
                  Follow
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-sm text-[var(--text-secondary)] mt-4 max-w-xl">
            {bio}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div>
            <span className="font-semibold text-[var(--text-primary)]">
              {followerCount}
            </span>{" "}
            <span className="text-[var(--text-tertiary)]">followers</span>
          </div>
          <div>
            <span className="font-semibold text-[var(--text-primary)]">
              {followingCount}
            </span>{" "}
            <span className="text-[var(--text-tertiary)]">following</span>
          </div>
          <div className="text-[var(--text-muted)] text-xs">
            Joined {joinDate}
          </div>
        </div>
      </div>
    </div>
  );
}
