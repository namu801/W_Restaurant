"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ClockIcon, WalletIcon } from "@heroicons/react/24/solid";
import { AREA_LABEL, FIT_TAG_VARIANT, formatPrice, simplifyBusinessHours } from "@/lib/labels";
import { conditionToSearchParams } from "@/lib/condition-query";
import { topStrengthTags } from "@/lib/reason";
import type { Condition, MatchResult } from "@/lib/types";
import { Tag } from "@/components/ui/Tag";
import { BookmarkButton } from "@/components/BookmarkButton";
import { PlaceThumbnail } from "@/components/PlaceThumbnail";
import { track } from "@/lib/analytics";

/**
 * 정보 순서: 식당명 → 지역·카테고리 → 사진 → 추천 멘트 → 가격·영업시간 → 강점 태그.
 * 레퍼런스(맛집 앱 카드)를 따라 식당명을 카드에서 가장 큰 글자로 두고, 가격·영업시간은
 * 서로 같은 위계(아이콘+본문 크기 텍스트)로 한 줄에 묶는다 — 예전처럼 가격만 accent 색에
 * 크게 키우지 않는다. 카테고리에 이미 음식 종류가 담겨 있어(예: "인도음식 전문점")
 * cuisineTags를 따로 또 보여주면 중복이라 메타 줄에서는 지역·카테고리 두 개만 쓴다.
 *
 * Link 전체엔 저장 버튼용 pr-14를 더 이상 안 준다 — 그걸 전체에 걸어두면 사진 아래
 * 추천 멘트 상자가 좌우 여백이 다르게(왼 16px, 오른 56px) 떠서 비대칭으로 보였다.
 * 저장 버튼과 실제로 겹칠 수 있는 헤더 줄(식당명+적합도 태그)에만 pr-10을 주고,
 * 그 아래 내용은 전부 좌우 동일한 p-4 여백을 그대로 쓴다.
 */
export function PlaceCard({
  match,
  condition,
  rank,
}: {
  match: MatchResult;
  condition: Condition;
  rank: number;
}) {
  const { place, score, fitLabel } = match;
  const strengthTags = topStrengthTags(match, 2);
  const detailHref = `/places/${place.id}?${conditionToSearchParams(condition).toString()}`;
  const photoCount = Math.max(place.photos.length, 1);

  return (
    <article className="relative overflow-hidden rounded-sm border border-line bg-cream-soft transition-transform duration-[120ms] ease-out hover:-translate-y-0.5">
      <Link
        href={detailHref}
        onClick={() => track("place_card_clicked", { place_id: place.id, rank, score, page: "results" })}
        className="block p-4"
      >
        <div className="flex items-start justify-between gap-2 pr-10">
          <h3 className="min-w-0 text-lg font-bold leading-snug tracking-tight text-ink">
            {place.name}
          </h3>
          <Tag variant={FIT_TAG_VARIANT[fitLabel]}>{fitLabel}</Tag>
        </div>
        <p className="mt-1 text-xs font-medium text-ink-soft">
          {AREA_LABEL[place.area]} · {place.category}
        </p>

        {/* 사진 — 왼쪽은 아무 마진 트릭도 안 쓴다. 부모의 p-4 왼쪽 패딩을 그대로 물려받아
            식당명과 항상 같은 x 위치에서 시작한다(이전엔 -mx-4와 px-4를 같이 써서 서로
            상쇄되긴 했지만 혼동을 일으켰다 — 아예 왼쪽은 건드리지 않는 쪽이 명확하다).
            오른쪽만 -mr-4로 부모 패딩을 상쇄해 다음 장이 카드 끝까지 살짝 걸쳐 보이게 한다.
            폭은 82%였던 걸 70%로 줄여서 사진 영역이 덜 넓어 보이게 했다 */}
        <div className="-mr-4 mt-3 flex snap-x snap-mandatory gap-1.5 overflow-x-auto">
          {Array.from({ length: photoCount }).map((_, i) => (
            <PlaceThumbnail
              key={i}
              place={place}
              paletteOffset={i}
              className="h-32 w-[70%] shrink-0 snap-start rounded-sm"
              iconClassName="h-8 w-8"
            />
          ))}
        </div>

        <p className="mt-3 flex items-start gap-1.5 rounded-sm bg-accent-soft px-3 py-2 text-xs font-medium leading-relaxed text-ink">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-accent" strokeWidth={2} fill="currentColor" aria-hidden />
          {place.curatedReason}
        </p>

        {/* 가격·영업시간을 한 줄로 묶는다. 영업시간은 브레이크타임·라스트오더까지 다
            보여주면 이 한 줄에 다 안 들어가서, 카드에서만 핵심 시간대만 남긴다
            (상세 페이지에는 원문 그대로 보여준다) */}
        <p className="mt-2.5 flex items-center gap-3 text-sm font-medium text-ink">
          {/* lucide는 스트로크 전용이라 fill="currentColor"를 억지로 주면 시계 바늘 같은
              내부 디테일이 뭉개졌다 — 실제로 solid로 그려진 Heroicons로 바꿨다
              (BottomNav 아이콘과 같은 이유·같은 세트) */}
          <span className="flex items-center gap-1.5">
            <WalletIcon className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            1인 {formatPrice(place.priceMin, place.priceMax)}
          </span>
          <span className="flex items-center gap-1.5">
            <ClockIcon className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            {simplifyBusinessHours(place.businessHours)}
          </span>
        </p>

        {strengthTags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {strengthTags.map((tag) => (
              <Tag key={tag} variant="neutral">
                {tag}
              </Tag>
            ))}
          </div>
        )}
      </Link>

      <BookmarkButton
        placeId={place.id}
        rank={rank}
        score={score}
        page="results"
        className="absolute right-4 top-4 !h-8 !w-8 !justify-center !gap-0 !rounded-full !border !border-line !bg-white !p-0 !text-ink-soft"
      />
    </article>
  );
}
