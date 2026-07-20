"use client";

import { Bookmark } from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { isBookmarked, toggleBookmark } from "@/lib/bookmarks";
import { track } from "@/lib/analytics";

export function BookmarkButton({
  placeId,
  rank,
  score,
  page,
  className,
  labeled = false,
}: {
  placeId: string;
  rank?: number;
  score?: number;
  page: "results" | "detail" | "bookmarks";
  className?: string;
  labeled?: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSaved(isBookmarked(placeId));
    setHydrated(true);
  }, [placeId]);

  function handleClick() {
    const next = toggleBookmark(placeId);
    setSaved(next);
    if (next) {
      track("place_bookmarked", { place_id: placeId, rank, score, page });
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition",
        saved
          ? "border-accent bg-accent-soft text-accent-strong"
          : "border-line bg-cream-soft text-ink-soft hover:border-ink-faint active:bg-cream-strong",
        !hydrated && "opacity-0",
        className,
      )}
    >
      <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
      {labeled && (saved ? "저장됨" : "저장하기")}
    </button>
  );
}
