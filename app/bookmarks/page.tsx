"use client";

import Link from "next/link";
import { Bookmark, ExternalLink, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { getBookmarkIds, toggleBookmark } from "@/lib/bookmarks";
import { getPlaceById } from "@/lib/places";
import { AREA_LABEL, formatPrice } from "@/lib/labels";
import { track } from "@/lib/analytics";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Place } from "@/lib/types";

export default function BookmarksPage() {
  const [places, setPlaces] = useState<Place[] | null>(null);

  useEffect(() => {
    const ids = getBookmarkIds();
    const found = ids.map(getPlaceById).filter((p): p is Place => Boolean(p));
    setPlaces(found);
    track("bookmark_list_viewed", { bookmark_count: found.length });
  }, []);

  function handleRemove(placeId: string) {
    toggleBookmark(placeId);
    setPlaces((prev) => (prev ? prev.filter((p) => p.id !== placeId) : prev));
  }

  if (places === null) {
    return <p className="py-14 text-center text-sm text-ink-faint">불러오는 중이에요…</p>;
  }

  if (places.length === 0) {
    return (
      <EmptyState
        title="아직 저장한 장소가 없어요."
        description={"마음에 드는 장소를 저장해두고\n다시 비교해보세요."}
        action={
          <Link
            href="/search"
            className="mt-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-cream hover:bg-ink/90"
          >
            모임 장소 찾아보기
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-ink">저장한 장소 {places.length}곳</h1>

      {places.map((place) => (
        <article
          key={place.id}
          className="rounded-2xl border border-line bg-white p-5 shadow-card"
        >
          <h3 className="text-base font-semibold text-ink">{place.name}</h3>
          <p className="mt-1 text-xs text-ink-faint">
            {place.category} · {AREA_LABEL[place.area]} · 1인{" "}
            {formatPrice(place.priceMin, place.priceMax)}
          </p>
          <p className="mt-2.5 text-sm text-ink-soft">{place.curatedReason}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href={`/places/${place.id}`}
              className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-cream hover:bg-ink/90"
            >
              상세 보기
            </Link>
            <a
              href={place.mapUrlNaver}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                track("map_clicked", { place_id: place.id, map_type: "naver" })
              }
              className="inline-flex items-center gap-1 rounded-full border border-line px-4 py-2.5 text-sm text-ink-soft hover:border-ink-faint"
            >
              <MapPin className="h-3.5 w-3.5" />
              지도 보기
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              type="button"
              onClick={() => handleRemove(place.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent-soft px-3.5 py-2 text-sm font-medium text-accent-strong"
            >
              <Bookmark className="h-4 w-4" fill="currentColor" />
              저장 해제
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
