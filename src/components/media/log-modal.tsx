"use client";

import { useState, useTransition, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/modal";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { logMedia, removeLog } from "@/lib/actions";
import type { MediaType } from "@/config/constants";

interface LogModalProps {
  open: boolean;
  onClose: () => void;
  media: {
    externalId: string;
    title: string;
    type: MediaType;
    posterUrl: string | null;
    provider: string;
  };
  existingLog?: {
    id: string;
    status: string;
    startedAt: string | null;
    finishedAt: string | null;
    progress: number | null;
  } | null;
}

/**
 * Get the appropriate status options for a media type.
 */
function getStatusOptions(type: MediaType) {
  const active = (() => {
    switch (type) {
      case "movie":
      case "tv_show":
      case "animation":
      case "anime":
        return { value: "watching", label: "Watching" };
      case "book":
      case "manga":
      case "comic":
        return { value: "reading", label: "Reading" };
      case "game":
        return { value: "playing", label: "Playing" };
      case "music":
        return { value: "listening", label: "Listening" };
      default:
        return { value: "watching", label: "Watching" };
    }
  })();

  return [
    { value: "planning", label: "Plan to " + active.label.slice(0, -3).toLowerCase() },
    active,
    { value: "completed", label: "Completed" },
    { value: "paused", label: "Paused" },
    { value: "dropped", label: "Dropped" },
    { value: "rewatching", label: "Re-" + active.label.toLowerCase() },
  ];
}

/**
 * Get the progress label for a media type.
 */
function getProgressLabel(type: MediaType): string {
  switch (type) {
    case "tv_show":
    case "anime":
    case "animation":
      return "Episode";
    case "book":
    case "manga":
    case "comic":
      return "Chapter";
    case "game":
      return "Hours Played";
    case "music":
      return "Listen Count";
    default:
      return "Progress";
  }
}

export default function LogModal({
  open,
  onClose,
  media,
  existingLog,
}: LogModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const statusOptions = useMemo(() => getStatusOptions(media.type), [media.type]);
  const progressLabel = useMemo(() => getProgressLabel(media.type), [media.type]);

  const [status, setStatus] = useState(existingLog?.status ?? "planning");
  const [startedAt, setStartedAt] = useState(existingLog?.startedAt ?? "");
  const [finishedAt, setFinishedAt] = useState(existingLog?.finishedAt ?? "");
  const [progress, setProgress] = useState<string>(
    existingLog?.progress?.toString() ?? ""
  );

  const showFinishedDate = status === "completed";
  const showProgress = !["movie", "music"].includes(media.type);

  function handleSave() {
    startTransition(async () => {
      try {
        await logMedia({
          externalId: media.externalId,
          type: media.type,
          provider: media.provider,
          status: status as "planning" | "watching" | "reading" | "playing" | "listening" | "completed" | "dropped" | "paused" | "rewatching",
          startedAt: startedAt || null,
          finishedAt: finishedAt || null,
          progress: progress ? parseInt(progress, 10) : null,
        });
        const statusLabel = statusOptions.find((o) => o.value === status)?.label ?? status;
        toast(`Logged ${media.title} as "${statusLabel}"`, "success");
        router.refresh();
        onClose();
      } catch (error) {
        toast(
          error instanceof Error ? error.message : "Failed to save log",
          "error"
        );
      }
    });
  }

  function handleRemove() {
    if (!existingLog) return;

    startTransition(async () => {
      try {
        await removeLog(
          existingLog.id,
          `/media/${media.type}/${media.externalId}`
        );
        toast("Log removed", "info");
        router.refresh();
        onClose();
      } catch (error) {
        toast(
          error instanceof Error ? error.message : "Failed to remove log",
          "error"
        );
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Log">
      <div className="flex flex-col gap-5">
        {/* Media preview */}
        <div className="flex items-center gap-4">
          {media.posterUrl && (
            <div className="shrink-0 w-14 h-20 rounded-[var(--radius-md)] overflow-hidden bg-[var(--bg-tertiary)]">
              <Image
                src={media.posterUrl}
                alt={media.title}
                width={56}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2">
              {media.title}
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] capitalize mt-0.5">
              {media.type.replace("_", " ")}
            </p>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
            Status
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                className={`
                  px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium
                  transition-all duration-150 text-left
                  ${
                    status === option.value
                      ? "bg-[var(--accent-primary)] text-[var(--accent-primary-text)]"
                      : "bg-[var(--surface-glass)] text-[var(--text-secondary)] hover:bg-[var(--surface-glass-hover)]"
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="started-at"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Started
            </label>
            <input
              id="started-at"
              type="date"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              className="
                w-full px-3 py-2 rounded-[var(--radius-md)]
                bg-[var(--bg-tertiary)] border border-[var(--border-primary)]
                text-[var(--text-primary)] text-sm
                focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent
                transition-all duration-150
              "
            />
          </div>

          {showFinishedDate && (
            <div>
              <label
                htmlFor="finished-at"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Finished
              </label>
              <input
                id="finished-at"
                type="date"
                value={finishedAt}
                onChange={(e) => setFinishedAt(e.target.value)}
                className="
                  w-full px-3 py-2 rounded-[var(--radius-md)]
                  bg-[var(--bg-tertiary)] border border-[var(--border-primary)]
                  text-[var(--text-primary)] text-sm
                  focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent
                  transition-all duration-150
                "
              />
            </div>
          )}
        </div>

        {/* Progress */}
        {showProgress && (
          <div>
            <label
              htmlFor="progress"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
            >
              {progressLabel}
            </label>
            <input
              id="progress"
              type="number"
              min="0"
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              placeholder="0"
              className="
                w-full px-3 py-2 rounded-[var(--radius-md)]
                bg-[var(--bg-tertiary)] border border-[var(--border-primary)]
                text-[var(--text-primary)] text-sm
                placeholder:text-[var(--text-muted)]
                focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent
                transition-all duration-150
              "
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          {existingLog && (
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
            Save Log
          </Button>
        </div>
      </div>
    </Modal>
  );
}
