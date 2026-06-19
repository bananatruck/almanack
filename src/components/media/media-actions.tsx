"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, BookmarkPlus, Pencil, ListPlus, Check } from "lucide-react";
import Button from "@/components/ui/button";
import StarRating from "@/components/ui/star-rating";
import RatingModal from "@/components/media/rating-modal";
import LogModal from "@/components/media/log-modal";
import { useToast } from "@/components/ui/toast";
import { toggleFavorite } from "@/lib/actions";
import type { MediaType } from "@/config/constants";

interface MediaActionsProps {
  media: {
    externalId: string;
    title: string;
    type: MediaType;
    posterUrl: string | null;
    provider: string;
  };
  userRating?: {
    id: string;
    score: number;
    isFavorite: boolean;
  } | null;
  userLog?: {
    id: string;
    status: string;
    startedAt: string | null;
    finishedAt: string | null;
    progress: number | null;
  } | null;
}

export default function MediaActions({
  media,
  userRating,
  userLog,
}: MediaActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [favPending, startFavTransition] = useTransition();
  const [localFavorite, setLocalFavorite] = useState(
    userRating?.isFavorite ?? false
  );

  const hasRating = userRating && userRating.score > 0;
  const hasLog = !!userLog;

  function handleFavoriteClick() {
    // Optimistic UI
    setLocalFavorite(!localFavorite);

    startFavTransition(async () => {
      try {
        const result = await toggleFavorite({
          externalId: media.externalId,
          type: media.type,
          provider: media.provider,
        });
        setLocalFavorite(result.isFavorite);
        toast(
          result.isFavorite ? "Added to favorites" : "Removed from favorites",
          "success"
        );
        router.refresh();
      } catch (error) {
        // Rollback
        setLocalFavorite(userRating?.isFavorite ?? false);
        toast(
          error instanceof Error ? error.message : "Failed to toggle favorite",
          "error"
        );
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Rate button */}
        <Button
          size="md"
          variant={hasRating ? "secondary" : "primary"}
          onClick={() => setRatingModalOpen(true)}
        >
          {hasRating ? (
            <>
              <StarRating rating={userRating.score} size="sm" />
              <span className="ml-0.5">Rated</span>
            </>
          ) : (
            <>
              <StarRating rating={0} size="sm" />
              Rate
            </>
          )}
        </Button>

        {/* Log button */}
        <Button
          variant="secondary"
          size="md"
          onClick={() => setLogModalOpen(true)}
        >
          {hasLog ? (
            <>
              <Check size={16} className="text-[var(--color-success)]" />
              <span className="capitalize">
                {userLog.status.replace("_", " ")}
              </span>
            </>
          ) : (
            <>
              <BookmarkPlus size={16} />
              Log
            </>
          )}
        </Button>

        {/* Review button (placeholder) */}
        <Button
          variant="secondary"
          size="md"
          onClick={() => toast("Reviews are coming in the next update!", "info")}
        >
          <Pencil size={16} />
          Review
        </Button>

        {/* Add to List (placeholder) */}
        <Button
          variant="secondary"
          size="md"
          onClick={() => toast("Lists are coming in the next update!", "info")}
        >
          <ListPlus size={16} />
          Add to List
        </Button>

        {/* Favorite */}
        <Button
          variant="ghost"
          size="md"
          onClick={handleFavoriteClick}
          disabled={favPending}
          aria-label={localFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            size={16}
            fill={localFavorite ? "var(--color-error)" : "none"}
            className={
              localFavorite
                ? "text-[var(--color-error)]"
                : "text-[var(--text-secondary)]"
            }
          />
        </Button>
      </div>

      {/* Modals */}
      <RatingModal
        open={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        media={media}
        existingRating={userRating}
      />

      <LogModal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        media={media}
        existingLog={userLog}
      />
    </>
  );
}
