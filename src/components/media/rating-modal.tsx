"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import Modal from "@/components/ui/modal";
import InteractiveStarRating from "@/components/ui/interactive-star-rating";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { rateMedia, removeRating } from "@/lib/actions";
import type { MediaType } from "@/config/constants";

interface RatingModalProps {
  open: boolean;
  onClose: () => void;
  media: {
    externalId: string;
    title: string;
    type: MediaType;
    posterUrl: string | null;
    provider: string;
  };
  existingRating?: {
    id: string;
    score: number;
    isFavorite: boolean;
  } | null;
}

export default function RatingModal({
  open,
  onClose,
  media,
  existingRating,
}: RatingModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [score, setScore] = useState(existingRating?.score ?? 0);
  const [isFavorite, setIsFavorite] = useState(
    existingRating?.isFavorite ?? false
  );

  function handleSave() {
    if (score === 0) {
      toast("Please select a rating", "error");
      return;
    }

    startTransition(async () => {
      try {
        await rateMedia({
          externalId: media.externalId,
          type: media.type,
          provider: media.provider,
          score,
          isFavorite,
        });
        toast(`Rated ${media.title} ${score} star${score !== 1 ? "s" : ""}`, "success");
        router.refresh();
        onClose();
      } catch (error) {
        toast(
          error instanceof Error ? error.message : "Failed to save rating",
          "error"
        );
      }
    });
  }

  function handleRemove() {
    if (!existingRating) return;

    startTransition(async () => {
      try {
        await removeRating(
          existingRating.id,
          `/media/${media.type}/${media.externalId}`
        );
        toast("Rating removed", "info");
        setScore(0);
        setIsFavorite(false);
        router.refresh();
        onClose();
      } catch (error) {
        toast(
          error instanceof Error ? error.message : "Failed to remove rating",
          "error"
        );
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Rate">
      <div className="flex flex-col items-center gap-5">
        {/* Media preview */}
        <div className="flex items-center gap-4 w-full">
          {media.posterUrl && (
            <div className="shrink-0 w-16 h-24 rounded-[var(--radius-md)] overflow-hidden bg-[var(--bg-tertiary)]">
              <Image
                src={media.posterUrl}
                alt={media.title}
                width={64}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-[var(--text-primary)] line-clamp-2">
              {media.title}
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] capitalize mt-0.5">
              {media.type.replace("_", " ")}
            </p>
          </div>
        </div>

        {/* Star rating */}
        <div className="py-2">
          <InteractiveStarRating
            rating={score}
            onChange={setScore}
            size="lg"
            showClear={false}
          />
        </div>

        {/* Favorite toggle */}
        <button
          type="button"
          onClick={() => setIsFavorite(!isFavorite)}
          className={`
            flex items-center gap-2 px-4 py-2
            rounded-[var(--radius-md)] text-sm font-medium
            transition-all duration-150
            ${
              isFavorite
                ? "bg-[var(--color-error-muted)] text-[var(--color-error)]"
                : "bg-[var(--surface-glass)] text-[var(--text-secondary)] hover:text-[var(--color-error)]"
            }
          `}
        >
          <Heart
            size={16}
            fill={isFavorite ? "var(--color-error)" : "none"}
          />
          {isFavorite ? "Favorited" : "Add to Favorites"}
        </button>

        {/* Actions */}
        <div className="flex gap-3 w-full pt-2">
          {existingRating && (
            <Button
              variant="ghost"
              size="md"
              className="text-[var(--color-error)]"
              onClick={handleRemove}
              loading={isPending}
            >
              Remove
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button size="md" onClick={handleSave} loading={isPending}>
            Save Rating
          </Button>
        </div>
      </div>
    </Modal>
  );
}
