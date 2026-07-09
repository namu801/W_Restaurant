"use client";

import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import { AREA_LABEL, MOOD_LABEL, formatPrice } from "@/lib/labels";
import { conditionToSearchParams } from "@/lib/condition-query";
import { generateCardReason } from "@/lib/reason";
import type { Condition, MatchResult } from "@/lib/types";
import { Tag } from "@/components/ui/Tag";
import { BookmarkButton } from "@/components/BookmarkButton";
import { track } from "@/lib/analytics";

const FIT_TAG_VARIANT = {
  "매우 적합": "positive",
  적합: "accent",
  보통: "neutral",
} as const;

export function PlaceCard({
  match,
  condition,
  rank,
}: {
  match: MatchResult;
  condition: Condition;
  rank: number;
}) {
  const { place, score, matchedMoods, fitLabel } = match;
  const reason = generateCardReason(condition, match);
  const detailHref = `/places/${place.id}?${conditionToSearchParams(condition).toString()}`;

  return (
    <article className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-ink">{place.name}</h3>
            <Tag variant={FIT_TAG_VARIANT[fitLabel]}>
              {fitLabel} · {score}점
            </Tag>
          </div>
          <p className="mt-1 text-xs text-ink-faint">
            {place.category} · {AREA_LABEL[place.area]} · 1인{" "}
            {formatPrice(place.priceMin, place.priceMax)}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-1 text-sm text-ink-soft">
        <p className="font-medium text-ink">{reason.headline}</p>
        <p>{reason.strengthLine}</p>
        <p className="text-ink-faint">{reason.cautionLine}</p>
      </div>

      {matchedMoods.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {matchedMoods.map((m) => (
            <Tag key={m} variant="neutral">
              #{MOOD_LABEL[m]}
            </Tag>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={detailHref}
          onClick={() =>
            track("place_card_clicked", { place_id: place.id, rank, score })
          }
          className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-cream hover:bg-ink/90"
        >
          상세 보기
        </Link>
        <a
          href={place.mapUrlNaver}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            track("map_clicked", {
              place_id: place.id,
              rank,
              score,
              map_type: "naver",
            })
          }
          className="inline-flex items-center gap-1 rounded-full border border-line px-4 py-2.5 text-sm text-ink-soft hover:border-ink-faint"
        >
          <MapPin className="h-3.5 w-3.5" />
          지도 보기
          <ExternalLink className="h-3 w-3" />
        </a>
        <BookmarkButton placeId={place.id} rank={rank} score={score} page="results" />
      </div>
    </article>
  );
}
