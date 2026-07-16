import { redirect } from "next/navigation";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
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
import { AREA_LABEL, BUDGET_LABEL, PEOPLE_LABEL, RELATIONSHIP_LABEL } from "@/lib/labels";
import { PlaceCard } from "@/components/PlaceCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrackOnMount } from "@/components/TrackOnMount";
import { ConditionEditSheet } from "@/components/ConditionEditSheet";

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
  const matches = matchPlaces(condition);
  const topScore = matches[0]?.score ?? 0;
  const query = conditionToSearchParams(condition).toString();
  const allAreaHref = `/results?${conditionToSearchParams({ ...condition, area: "all" }).toString()}`;
  const showAllHref = `/results?${query}&showAll=1`;

  const isTruncated = !showAll && matches.length > RESULT_TRUNCATE_THRESHOLD;
  const visibleMatches = isTruncated ? matches.slice(0, RESULT_DISPLAY_LIMIT) : matches;
  const isNarrow = matches.length > 0 && matches.length <= NARROW_RESULT_THRESHOLD;
  const relaxation = matches.length === 0 ? findRelaxationSuggestion(condition) : null;
  const relaxationHref = relaxation
    ? `/results?${conditionToSearchParams(relaxation.condition).toString()}`
    : null;

  return (
    <div className="flex flex-col gap-7">
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

      <div className="flex items-start justify-between gap-3 rounded-md border border-line bg-cream-soft p-5">
        <div className="text-sm text-ink-soft">
          <p className="font-medium text-ink">
            {RELATIONSHIP_LABEL[condition.relationship]} · {PEOPLE_LABEL[condition.people]} ·{" "}
            {BUDGET_LABEL[condition.budget]}
          </p>
          <p className="mt-1 text-xs text-ink-faint">{AREA_LABEL[condition.area]} 기준</p>
        </div>
        <ConditionEditSheet condition={condition} resultCount={matches.length} />
      </div>

      {isNarrow && (
        <div className="flex items-start gap-2.5 rounded-sm border border-clay/30 bg-clay-soft px-4 py-3.5 text-sm text-clay">
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
                className="rounded-full border border-ink px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-cream-soft active:bg-cream-strong"
              >
                조건 수정하기
              </Link>
              {relaxationHref ? (
                <Link
                  href={relaxationHref}
                  className="rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-strong active:bg-accent-strong"
                >
                  조건 살짝 낮춰서 보기
                </Link>
              ) : (
                <Link
                  href={allAreaHref}
                  className="rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-strong active:bg-accent-strong"
                >
                  강남권 전체로 보기
                </Link>
              )}
            </div>
          }
        />
      ) : (
        <>
          <p className="text-sm text-ink-faint">
            {isTruncated
              ? `입력한 조건에 잘 맞는 장소가 ${matches.length}곳 있어요. 우선 ${RESULT_DISPLAY_LIMIT}곳을 추천해드릴게요.`
              : `추천 후보 ${matches.length}곳`}
          </p>

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
              className="self-center rounded-full border border-ink px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-cream-soft active:bg-cream-strong"
            >
              전체 {matches.length}곳 보기
            </Link>
          )}
        </>
      )}
    </div>
  );
}
