import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import {
  searchParamsToCondition,
  conditionToSearchParams,
} from "@/lib/condition-query";
import {
  matchPlaces,
  findRelaxationSuggestion,
  findNearMissMatches,
  NARROW_RESULT_THRESHOLD,
  RESULT_TRUNCATE_THRESHOLD,
  RESULT_DISPLAY_LIMIT,
} from "@/lib/scoring";
import { PlaceListItem } from "@/components/PlaceListItem";
import { CurationAgentCard } from "@/components/CurationAgentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrackOnMount } from "@/components/TrackOnMount";
import { ConditionEditSheet } from "@/components/ConditionEditSheet";
import { SortDropdown, type SortValue } from "@/components/SortDropdown";
import { buildAgentHeadline, generateAlternativeMeta, generateRowReason, generateVerdict, type AlternativeAxis } from "@/lib/reason";
import type { Condition, MatchResult } from "@/lib/types";

function pickBy(pool: MatchResult[], scoreFn: (m: MatchResult) => number): MatchResult | undefined {
  if (pool.length === 0) return undefined;
  return [...pool].sort((a, b) => scoreFn(b) - scoreFn(a))[0];
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const condition = searchParamsToCondition(sp);

  if (!condition) {
    redirect("/search");
  }

  const showAll = sp.showAll === "1";
  const sort: SortValue = sp.sort === "price" ? "price" : "recommended";
  const matches = matchPlaces(condition);
  const topScore = matches[0]?.score ?? 0;
  const query = conditionToSearchParams(condition).toString();
  const allAreaHref = `/results?${conditionToSearchParams({ ...condition, area: "all" }).toString()}`;
  const sortQuery = sort === "price" ? "&sort=price" : "";
  const showAllHref = `/results?${query}&showAll=1${sortQuery}`;

  // "추천순"은 matchPlaces가 이미 매칭 점수순으로 정렬해 돌려준다. "가격 낮은순"만
  // 화면에 보여줄 목록 순서를 다시 계산한다 — topScore 등 점수 기반 안내 문구는
  // 원래(추천순) 배열 그대로 써야 하므로 별도 변수로 분리한다
  const displayMatches =
    sort === "price"
      ? [...matches].sort(
          (a, b) =>
            a.place.priceMin + a.place.priceMax - (b.place.priceMin + b.place.priceMax),
        )
      : matches;

  const isTruncated = !showAll && matches.length > RESULT_TRUNCATE_THRESHOLD;
  const visibleMatches = isTruncated ? displayMatches.slice(0, RESULT_DISPLAY_LIMIT) : displayMatches;
  // "청모픽 N순위" 배지는 항상 매칭 점수 기준(matches 원래 순서)이어야 한다 — 정렬을
  // "가격 낮은순"으로 바꿔서 카드 노출 순서(index)가 달라져도, 배지에 찍히는 순위는
  // 그대로 추천 점수 기준을 유지해야 가장 싼 곳이 "1순위"로 잘못 보이지 않는다

  // 6곳이 점수순으로 줄만 서 있으면, 결국 사용자가 직접 하나하나 다시 비교해야 한다 —
  // 1순위 옆에 "분위기를 더 챙긴 선택/예산이 편한 선택/룸을 우선한 선택"처럼 다른 가치
  // 기준의 대안을 나란히 제안해야 진짜 큐레이션이 된다. 다만 "가격 낮은순"으로 정렬을
  // 바꾼 상태에서는 "1순위" 개념 자체가 정렬 기준과 어긋나 혼란을 주므로, 추천순일 때만
  // 이 구조를 쓰고 가격순에선 기존 평면 목록으로 보여준다
  const showCuratedLayout = sort === "recommended";
  const hero = showCuratedLayout ? visibleMatches[0] : undefined;
  const restForAlternatives = showCuratedLayout ? visibleMatches.slice(1) : [];

  const moodPick = pickBy(restForAlternatives, (m) => m.ratios.mood + m.ratios.conversation);
  const usedIds = new Set<string>([hero?.place.id, moodPick?.place.id].filter((v): v is string => Boolean(v)));
  const budgetPick = pickBy(
    restForAlternatives.filter((m) => !usedIds.has(m.place.id)),
    (m) => -(m.place.priceMin + m.place.priceMax),
  );
  if (budgetPick) usedIds.add(budgetPick.place.id);
  const roomPick = pickBy(
    restForAlternatives.filter((m) => !usedIds.has(m.place.id) && m.place.privateRoomAvailable),
    (m) => m.fitRatio,
  );
  if (roomPick) usedIds.add(roomPick.place.id);

  const alternatives: { axis: AlternativeAxis; match: MatchResult }[] = (
    [
      moodPick && { axis: "mood" as const, match: moodPick },
      budgetPick && { axis: "budget" as const, match: budgetPick },
      roomPick && { axis: "room" as const, match: roomPick },
    ] as const
  ).filter((v): v is { axis: AlternativeAxis; match: MatchResult } => Boolean(v));

  const remaining = restForAlternatives.filter((m) => !usedIds.has(m.place.id));
  const heroVerdict = hero ? generateVerdict(condition, hero) : null;

  const isNarrow = matches.length > 0 && matches.length <= NARROW_RESULT_THRESHOLD;
  const relaxation = matches.length === 0 ? findRelaxationSuggestion(condition) : null;
  const relaxationHref = relaxation
    ? `/results?${conditionToSearchParams(relaxation.condition).toString()}`
    : null;
  // 결과가 0곳이거나 너무 적을 때(isNarrow) 빈 화면·달랑 1~2장만 보여주면 아쉽다 —
  // 제외 조건을 무시하고 그나마 점수가 가장 높은 후보들을 더 보여준다. describeViolations는
  // 실제 매칭(위반 0개)은 자동으로 걸러내므로 매칭된 곳과 중복될 일이 없다
  const nearMisses = matches.length <= NARROW_RESULT_THRESHOLD ? findNearMissMatches(condition, 4) : [];

  // 모든 항목이 같은 뼈대(PlaceListItem)를 쓰고, 윗줄 문구만 자리에 따라 달라진다.
  // 번호는 추천순일 때 화면에 놓인 순서 그대로 붙인다. 점수 순위로 붙였더니 "예산이 편한 선택"처럼
  // 점수는 낮아도 앞에 놓인 곳(6위)만 번호가 빠져 순서가 끊겨 보였다. 가격순은 추천 순서가 아니라 번호를 뺀다
  type Item = { match: MatchResult; label?: { rank?: number; text?: string }; tone?: "accent" | "default" | "muted" };
  const curatedOrder: Item[] =
    showCuratedLayout && hero
      ? [
          { match: hero, label: { text: heroVerdict?.headline }, tone: "accent" },
          ...alternatives.map(({ axis, match }) => ({
            match,
            label: { text: generateAlternativeMeta(axis, match).title },
          })),
          ...remaining.map((match) => ({ match })),
        ]
      : visibleMatches.map((match) => ({ match }));
  const listItems: Item[] = showCuratedLayout
    ? curatedOrder.map((item, i) => ({ ...item, label: { ...item.label, rank: i + 1 } }))
    : curatedOrder;
  // 조건엔 안 맞는 대안도 같은 뼈대를 쓰되, 번호를 위 목록에 이어 붙이고 회색으로 낮춰 "추천"과 구분한다
  const nearMissItems: Item[] = nearMisses.map(({ match, violations }, i) => ({
    match,
    label: {
      rank: listItems.length + i + 1,
      text: matches.length === 0 && i === 0 ? "조건에 가장 가까운 곳" : violations.join(" · "),
    },
    tone: "muted",
  }));

  // 근거 한 줄은 화면 순서대로 고르면서 위에서 이미 쓴 근거를 피한다 — 같은 조건이면 여러 곳이
  // 똑같이 "조용한 편이라…"로 시작해 차이가 안 보였다
  const usedReasons = new Set<string>();
  const reasonOf = new Map(
    [...listItems, ...nearMissItems].map(({ match }) => {
      const r = generateRowReason(condition, match, usedReasons);
      if (r.key) usedReasons.add(r.key);
      return [match.place.id, { reason: r.reason, caveat: r.caveat }] as const;
    }),
  );

  // 추천 카드의 다음 요청 칩: 실제로 결과가 달라지는 조건 변경만, 바뀐 뒤 곳 수와 함께 보여준다
  const BUDGET_STEPS: Condition["budget"][] = ["under-20k", "20-30k", "30-50k", "over-50k"];
  const budgetIndex = BUDGET_STEPS.indexOf(condition.budget);
  const suggestionCandidates: { text: string; next: Condition }[] = [
    ...(!condition.extraConditions.includes("room-required")
      ? [{ text: "룸 있는 곳만 보여줘", next: { ...condition, extraConditions: [...condition.extraConditions, "room-required" as const] } }]
      : []),
    ...(condition.noise !== "quiet" ? [{ text: "더 조용한 곳만 보여줘", next: { ...condition, noise: "quiet" as const } }] : []),
    ...(budgetIndex > 0
      ? [{ text: "예산을 한 단계 낮춰줘", next: { ...condition, budget: BUDGET_STEPS[budgetIndex - 1] } }]
      : []),
    ...(condition.area !== "all" ? [{ text: "용산권 전체에서 찾아줘", next: { ...condition, area: "all" as const } }] : []),
  ];
  const suggestions = suggestionCandidates
    .map(({ text, next }) => ({
      text,
      href: `/results?${conditionToSearchParams(next).toString()}`,
      count: matchPlaces(next).length,
    }))
    .filter((s) => s.count > 0 && s.count !== matches.length)
    .slice(0, 2);

  // 식당 내용은 큐레이터 카드보다 양옆을 한 단계 더 들인다(PlaceListItem의 px-2). 구분선은 들이지 않는다
  const renderList = (items: Item[], startIndex = 0) => (
    <div className="divide-y divide-line">
      {items.map((item, i) => (
        <div key={item.match.place.id} className="animate-list-in" style={{ "--i": i } as CSSProperties}>
          <PlaceListItem
            match={item.match}
            condition={condition}
            rank={startIndex + i + 1}
            label={item.label}
            tone={item.tone}
            {...reasonOf.get(item.match.place.id)!}
          />
        </div>
      ))}
    </div>
  );

  return (
    // 목록은 레퍼런스(쿠팡이츠·캐치테이블)처럼 카드 상자 없이 흰 바닥 위에 구분선으로만 나눈다
    <div className="-mx-6 -mt-8 flex min-h-full flex-col bg-cream-soft px-6 pt-6">
      <TrackOnMount
        event="result_viewed"
        props={{ result_count: matches.length, top_score: topScore }}
      />
      {matches.length === 0 && (
        <TrackOnMount
          event="empty_result_viewed"
          props={{ extra_conditions: condition.extraConditions.join(","), near_miss_count: nearMisses.length }}
        />
      )}

      {/* 좌측 총 개수 + 우측 정렬·필터 한 줄. 숫자는 지금 화면에 그려지는 개수(visibleMatches)를
          쓴다 — 전체 개수를 띄우고 6곳만 보이면 개수가 안 맞는 오류처럼 읽혔다 */}
      <div className="flex items-center justify-between">
        <p className="text-label font-semibold text-ink">총 {visibleMatches.length}개</p>
        <div className="flex items-center gap-3">
          <SortDropdown sort={sort} />
          <ConditionEditSheet condition={condition} resultCount={matches.length} />
        </div>
      </div>

      {matches.length === 0 ? (
        <>
          <div className="mt-5">
            <EmptyState
              title="조건에 딱 맞는 장소를 찾지 못했어요."
              description={relaxation ? relaxation.message : "지역을 넓히거나 조건을 조정해보세요."}
              action={
                <div className="mt-2 flex flex-wrap gap-2">
                  <ConditionEditSheet condition={condition} trigger="emptyState" />
                  <Link
                    href={relaxationHref ?? allAreaHref}
                    className="rounded-full bg-accent px-4 py-2.5 text-label font-medium text-white transition-all hover:bg-accent-strong"
                  >
                    {relaxationHref ? "조건 넓혀서 보기" : "용산권 전체로 보기"}
                  </Link>
                </div>
              }
            />
          </div>
          {nearMissItems.length > 0 && (
            <section className="mt-8">
              <h2 className="flex items-center gap-1.5 px-2 text-h2 font-bold text-ink">
                {/* 위 큐레이터 카드와 같은 아이콘을 회색으로 — 같은 큐레이터의 "덤" 제안이라는 신호 */}
                <Sparkles className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={2} fill="currentColor" aria-hidden />
                그래도 가장 가까운 후보
              </h2>
              {renderList(nearMissItems)}
            </section>
          )}
        </>
      ) : (
        <>
          <div className="mt-4 mb-2">
            <CurationAgentCard
              {...buildAgentHeadline(condition)}
              suggestions={suggestions}
            />
          </div>

          {renderList(listItems)}

          {isTruncated && (
            <Link
              href={showAllHref}
              className="mb-2 self-center rounded-full border border-line px-4 py-2.5 text-label font-medium text-ink transition-all hover:bg-cream-strong active:bg-cream-strong"
            >
              전체 {matches.length}곳 보기
            </Link>
          )}

          {/* 실제 매칭이 1~2곳뿐이면 조건엔 안 맞지만 점수가 높은 후보를 몇 곳 더 채운다 */}
          {isNarrow && nearMissItems.length > 0 && (
            <section className="-mx-6 mt-4 border-t-8 border-cream px-6 pt-6">
              {/* 굵은 구분 띠는 화면 양끝까지 가로지른다 */}
              <h2 className="flex items-center gap-1.5 px-2 text-h2 font-bold text-ink">
                {/* 위 큐레이터 카드와 같은 아이콘을 회색으로 — 같은 큐레이터의 "덤" 제안이라는 신호 */}
                <Sparkles className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={2} fill="currentColor" aria-hidden />
                조건엔 안 맞지만 이런 곳은 어때요?
              </h2>
              {renderList(nearMissItems, listItems.length)}
            </section>
          )}
        </>
      )}
    </div>
  );
}
