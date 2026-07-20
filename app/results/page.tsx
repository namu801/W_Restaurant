import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, TriangleAlert } from "lucide-react";
import {
  searchParamsToCondition,
  conditionToSearchParams,
} from "@/lib/condition-query";
import {
  matchPlaces,
  findRelaxationSuggestion,
  NARROW_RESULT_THRESHOLD,
  RESULT_TRUNCATE_THRESHOLD,
  RESULT_DISPLAY_LIMIT,
} from "@/lib/scoring";
import { PlaceCard } from "@/components/PlaceCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrackOnMount } from "@/components/TrackOnMount";
import { ConditionEditSheet } from "@/components/ConditionEditSheet";
import { SortDropdown, type SortValue } from "@/components/SortDropdown";

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
  const isNarrow = matches.length > 0 && matches.length <= NARROW_RESULT_THRESHOLD;
  const relaxation = matches.length === 0 ? findRelaxationSuggestion(condition) : null;
  const relaxationHref = relaxation
    ? `/results?${conditionToSearchParams(relaxation.condition).toString()}`
    : null;

  return (
    <div className="flex flex-col gap-5">
      <TrackOnMount
        event="result_viewed"
        props={{ result_count: matches.length, top_score: topScore }}
      />
      {matches.length === 0 && (
        <TrackOnMount
          event="empty_result_viewed"
          props={{ extra_conditions: condition.extraConditions.join(",") }}
        />
      )}

      {/* 레퍼런스(마켓컬리 검색 결과)처럼 조건 요약을 박스로 묶지 않고, 좌측 총 개수 +
          우측 정렬·필터 한 줄로 바꿨다. 상세 조건은 "필터" 시트를 열어야 보이지만,
          그건 어차피 지금 즉시 알아야 할 정보라기보단 "고치고 싶을 때" 찾는 정보라
          평소엔 숨겨두는 편이 화면을 덜 무겁게 한다.
          이 숫자는 matches.length(조건에 맞는 전체 개수, 예: 19)가 아니라
          visibleMatches.length(실제로 지금 화면에 카드로 그려지는 개수, 예: 6)를 써야 한다 —
          "총 19개"라고 띄워놓고 카드가 6장만 보이면, 바로 아래 "19곳 중 6곳을 골라드렸어요"
          배지와 숫자가 겹쳐 보여서 마치 개수가 안 맞는 오류처럼 읽혔다. "전체 보기"를 눌러
          showAll이 되면 visibleMatches === matches라 그때는 그대로 전체 개수가 뜬다 */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">총 {visibleMatches.length}개</p>
        <div className="flex items-center gap-3">
          <SortDropdown sort={sort} />
          <ConditionEditSheet condition={condition} resultCount={matches.length} />
        </div>
      </div>

      {isNarrow && (
        <div className="flex items-start gap-2.5 rounded-md border border-clay/30 bg-clay-soft px-4 py-3.5 text-sm text-clay">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>조건에 맞는 장소가 많지 않아요. 아래 후보부터 확인해보세요.</p>
        </div>
      )}

      {matches.length === 0 ? (
        <EmptyState
          title="조건에 딱 맞는 장소를 찾지 못했어요."
          description={
            relaxation
              ? relaxation.message
              : "지역을 넓히거나 조건을 조정해보세요."
          }
          action={
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={`/search?${query}`}
                className="rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink transition-all hover:bg-cream-strong active:bg-cream-strong"
              >
                조건 수정하기
              </Link>
              {relaxationHref ? (
                <Link
                  href={relaxationHref}
                  className="rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-strong"
                >
                  조건 살짝 낮춰서 보기
                </Link>
              ) : (
                <Link
                  href={allAreaHref}
                  className="rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-strong"
                >
                  용산권 전체로 보기
                </Link>
              )}
            </div>
          }
        />
      ) : (
        <>
          {/* 이전엔 결과가 8곳을 넘어 일부만 잘라 보여줄 때(isTruncated)만 이 배지가 떴다 —
              그럼 결과가 적을 땐 "우리가 골라줬다"는 큐레이션 인상이 아예 안 보였다. 큐레이션은
              몇 곳을 추렸는지와 무관하게 이 리스트의 성격이라, 결과가 있는 한 항상 띄우고
              문구만 두 갈래로 나눈다 — 일부만 골라 보여줄 때는 "N곳 중 M곳", 결과가 적어
              전부 다 보여줄 때는 "N곳 중 N곳"처럼 같은 숫자가 겹쳐 보이지 않도록 다른 문장을 쓴다.
              옅은 틴트 채움만으로는 강조가 부족해서, 채움은 그대로 두고 그라디언트 테두리를
              다시 얹었다 — 대신 옆의 "필터" 버튼에서 테두리·채움을 걷어내 이 배지가 화면에서
              유일하게 "테두리+채움"을 다 쓰는 자리가 되게 했다. radius도 식당 카드와
              맞춰 rounded-sm으로 낮췄다(더는 pill이 아니다) */}
          <div className="w-full rounded-sm bg-gradient-to-r from-accent to-gold p-[2px]">
            <div className="flex w-full items-center gap-1.5 rounded-sm bg-gradient-to-r from-accent-soft to-gold-soft px-3.5 py-2.5 text-sm font-semibold text-accent-strong">
              <Sparkles className="h-4 w-4 shrink-0" strokeWidth={1.5} fill="currentColor" aria-hidden />
              {isTruncated
                ? `${matches.length}곳 중 가장 잘 맞는 ${RESULT_DISPLAY_LIMIT}곳을 골라드렸어요`
                : `조건에 맞는 ${matches.length}곳을 골라드렸어요`}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {visibleMatches.map((match, index) => (
              <PlaceCard
                key={match.place.id}
                match={match}
                condition={condition}
                rank={index + 1}
              />
            ))}
          </div>

          {isTruncated && (
            <Link
              href={showAllHref}
              className="self-center rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink transition-all hover:bg-cream-strong active:bg-cream-strong"
            >
              전체 {matches.length}곳 보기
            </Link>
          )}
        </>
      )}
    </div>
  );
}
