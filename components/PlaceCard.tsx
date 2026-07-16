"use client";

import Link from "next/link";
import { AREA_LABEL, formatPrice } from "@/lib/labels";
import { conditionToSearchParams } from "@/lib/condition-query";
import { generateListReason, topStrengthTags } from "@/lib/reason";
import type { Condition, MatchResult } from "@/lib/types";
import { Tag } from "@/components/ui/Tag";
import { BookmarkButton } from "@/components/BookmarkButton";
import { PlaceThumbnail } from "@/components/PlaceThumbnail";
import { track } from "@/lib/analytics";

const FIT_TAG_VARIANT = {
  "매우 잘 맞아요": "positive",
  "잘 맞아요": "accent",
  "일부 조건을 확인해보세요": "neutral",
} as const;

/**
 * 이름이 사진보다 먼저 나오는 위계, 여러 장 사진 스트립, 한 줄 추천 이유는 네이버지도·
 * 캐치테이블 참고안 그대로 유지한다. 다만 리스트를 구분선 하나로만 묶었더니 식당이
 * 여러 개 쌓였을 때 오히려 더 복잡해 보인다고 해서, 각 항목을 다시 개별 카드로 분리했다.
 * Link 안에 button을 중첩할 수 없어 저장 버튼만 별도 행으로 뺐다.
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
  const reason = generateListReason(condition, match);
  const detailHref = `/places/${place.id}?${conditionToSearchParams(condition).toString()}`;

  return (
    <article className="relative rounded-lg border border-line bg-cream-soft p-4 transition-shadow hover:shadow-card">
      <Link
        href={detailHref}
        onClick={() => track("place_card_clicked", { place_id: place.id, rank, score })}
        className="block active:opacity-80"
      >
        {/* 저장 버튼이 이 헤더 자리 오른쪽 위에 absolute로 겹쳐 있어서, 적합도 태그가
            그 밑에 깔리지 않도록 오른쪽에 자리를 비워둔다. 버튼 실제 폭(44px)만큼만 비우면
            태그가 꽉 찼을 때 버튼에 딱 붙어버려서, 여유를 조금 더 둔다 */}
        <div className="flex items-start justify-between gap-2 pr-14">
          <h3 className="font-serif text-base font-bold leading-snug text-ink">
            {place.name}{" "}
            <span className="font-sans text-xs font-medium text-ink-faint">{place.category}</span>
          </h3>
          <Tag variant={FIT_TAG_VARIANT[fitLabel]}>{fitLabel}</Tag>
        </div>
        <p className="mt-1 text-xs text-ink-faint">
          {AREA_LABEL[place.area]} · 1인 {formatPrice(place.priceMin, place.priceMax)}
        </p>

        {strengthTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {strengthTags.map((tag) => (
              <Tag key={tag} variant="neutral">
                {tag}
              </Tag>
            ))}
          </div>
        )}

        {/* 캐치테이블의 짧은 소개 문구를 참고한 강조 한 줄. 실제로는 룰 기반 채점 결과라 "AI"라고 붙이진 않는다 */}
        <p className="mt-2.5 flex items-start gap-1.5 rounded-md border border-accent/25 bg-accent-soft/50 px-3 py-2 text-xs leading-relaxed text-ink">
          <span aria-hidden>✨</span>
          {reason}
        </p>

        <div className="mt-3 flex gap-2 overflow-x-auto">
          <PlaceThumbnail place={place} paletteOffset={0} className="h-24 w-32 shrink-0 rounded-md" iconClassName="h-8 w-8" />
          <PlaceThumbnail place={place} paletteOffset={1} className="h-24 w-32 shrink-0 rounded-md" iconClassName="h-8 w-8" />
          <PlaceThumbnail place={place} paletteOffset={2} className="h-24 w-32 shrink-0 rounded-md" iconClassName="h-8 w-8" />
        </div>
      </Link>

      {/* 사진 스트립 아래 혼자 뚝 떨어진 줄에 있었더니 뭘 위한 버튼인지 붙어 보이지 않았다.
          이름·적합도가 있는 헤더 자리로 올려서 "이 식당에 대한 액션"이라는 게 바로 읽히게 한다.
          Link 안에 button을 중첩할 수 없어 형제로 두고 absolute로 겹친다 */}
      <BookmarkButton
        placeId={place.id}
        rank={rank}
        score={score}
        page="results"
        className="absolute right-4 top-4 shadow-card"
      />
    </article>
  );
}
