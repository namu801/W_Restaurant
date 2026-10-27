"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { Clock, Info, Sparkles, Wallet } from "lucide-react";
import { AREA_LABEL, formatPrice, todayBusinessHours } from "@/lib/labels";
import { conditionToSearchParams } from "@/lib/condition-query";
import type { Condition, MatchResult } from "@/lib/types";
import { BookmarkButton } from "@/components/BookmarkButton";
import { PlaceThumbnail } from "@/components/PlaceThumbnail";
import { track } from "@/lib/analytics";

/**
 * 결과 목록의 식당 한 곳. 1순위든 6위든 조건에 안 맞는 대안이든 모두 같은 뼈대를 쓴다
 * (쿠팡이츠·캐치테이블처럼 순서와 칸이 고정되고, 차이는 칸에 담기는 내용으로만 낸다).
 *
 *   [윗줄]   1순위 · 윗분 모시는 자리로 가장 잘 맞는 곳        ← 없으면 생략
 *   [이름]   일일향 용산점                              [저장]
 *   [메타]   신용산역 · 중식 코스요리 전문점
 *   [사진]   큰 사진 1 + 작은 사진 2
 *   [이유]   이 집을 고른 근거 한 줄(테두리 박스)
 *   [정보]   1인 가격 · 오늘 영업시간
 *   [주의]   아쉬운 점                                  ← 없으면 생략
 *
 * 카드 상자는 쓰지 않는다. 흰 바닥 위에 구분선만 두고, 사진이 각 항목의 시작점 역할을 한다.
 */
export function PlaceListItem({
  match,
  condition,
  rank,
  label,
  tone = "default",
  reason,
  caveat,
}: {
  match: MatchResult;
  condition: Condition;
  /** 화면 노출 순서(분석 이벤트용) */
  rank: number;
  /** 윗줄 문구. 순위·고른 기준·조건과 어긋난 점 등 */
  label?: { rank?: number; text?: string };
  /** 윗줄 색. accent = 1순위, muted = 조건엔 안 맞는 대안(번호·문구 모두 회색) */
  tone?: "accent" | "default" | "muted";
  reason: string;
  caveat: string | null;
}) {
  const { place, score } = match;
  // 상세에서도 목록과 같은 윗줄(번호·문구)을 보여주려고 함께 넘긴다
  const detailParams = conditionToSearchParams(condition);
  if (label?.rank) detailParams.set("r", String(label.rank));
  if (label?.text) detailParams.set("l", label.text);
  if (tone === "muted") detailParams.set("t", "m");
  const detailHref = `/places/${place.id}?${detailParams.toString()}`;
  const photoCount = Math.min(place.photos.length, 3);
  const onClick = () => track("place_card_clicked", { place_id: place.id, rank, score, page: "results" });

  return (
    <article className="relative px-2 py-6">
      <Link href={detailHref} onClick={onClick} className="block transition-transform duration-150 ease-out active:scale-[0.99]">
        {(label?.rank || label?.text) && (
          <p className="mb-1 flex items-center gap-1.5 pr-10 text-caption font-semibold">
            {label.rank && (
              <span
                className={clsx(
                  "flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-micro font-bold",
                  tone === "accent" ? "bg-accent text-white" : tone === "muted" ? "bg-ink-faintest text-white" : "bg-ink text-white",
                )}
              >
                {label.rank}
              </span>
            )}
            {label.text && (
              <span className={clsx("truncate", tone === "accent" ? "font-bold text-accent" : "text-ink-soft")}>
                {label.text}
              </span>
            )}
          </p>
        )}

        <h3 className="truncate pr-10 text-h1 font-bold text-ink">{place.name}</h3>
        <p className="mt-1 truncate text-label text-ink-soft">
          {AREA_LABEL[place.area]} · {place.category}
        </p>

        {/* 사진: 큰 칸 1 + 작은 칸 2. 가로 스크롤을 없애 목록 안에 스크롤이 겹치지 않게 했다 */}
        <div
          className={clsx(
            "mt-3 grid h-44 gap-1 overflow-hidden rounded-sm",
            photoCount >= 3 ? "grid-cols-3 grid-rows-2" : photoCount === 2 ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {Array.from({ length: Math.max(photoCount, 1) }).map((_, i) => (
            <PlaceThumbnail
              key={i}
              place={place}
              paletteOffset={i}
              sizes={i === 0 ? "360px" : "160px"}
              className={clsx("h-full w-full", photoCount >= 3 && i === 0 && "col-span-2 row-span-2")}
              iconClassName="h-8 w-8"
            />
          ))}
        </div>

        {/* 맨 위 추천 카드가 테두리를 쓰니, 식당마다 반복되는 이 줄은 옅은 채움으로 한 단계 낮춘다 */}
        <p
          className={clsx(
            "mt-3 flex items-start gap-1.5 rounded-md px-3 py-2.5 text-body-sm font-medium text-ink",
            tone === "muted" ? "bg-cream-strong" : "bg-accent-soft/40",
          )}
        >
          <Sparkles
            className={clsx("mt-[3px] h-3.5 w-3.5 shrink-0", tone === "muted" ? "text-ink-faint" : "text-accent")}
            strokeWidth={2}
            fill="currentColor"
            aria-hidden
          />
          {reason}
        </p>

        <div className="mt-3 flex flex-col gap-1.5 text-label text-ink">
          <p className="flex items-center gap-1.5">
            <Wallet className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden />
            <span className="font-semibold">1인 {formatPrice(place.priceMin, place.priceMax)}</span>
            <span className="text-ink-faint">·</span>
            <Clock className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden />
            {todayBusinessHours(place.businessHours)}
          </p>
          {caveat && (
            <p className="flex items-start gap-1.5 text-ink-soft">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden />
              {caveat}
            </p>
          )}
        </div>
      </Link>

      <BookmarkButton
        placeId={place.id}
        rank={rank}
        score={score}
        page="results"
        // 아이콘은 이름(22px)과 같은 높이로 키우고, 누르는 영역은 40px로 넉넉히 둔다.
        // 세로 중심은 이름 줄 중심에 맞춘다(윗줄이 있으면 그만큼 내려간다)
        iconClassName="h-[22px] w-[22px]"
        className={clsx(
          "absolute right-0 !h-10 !w-10 !justify-center !gap-0 !rounded-full !border-0 !bg-transparent !p-0 !text-ink",
          label?.rank || label?.text ? "top-[41px]" : "top-[19px]",
        )}
      />
    </article>
  );
}
