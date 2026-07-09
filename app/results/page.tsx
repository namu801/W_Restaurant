import { redirect } from "next/navigation";
import Link from "next/link";
import { searchParamsToCondition, conditionToSearchParams } from "@/lib/condition-query";
import { matchPlaces } from "@/lib/scoring";
import {
  AREA_LABEL,
  BUDGET_LABEL,
  PEOPLE_LABEL,
  RELATIONSHIP_LABEL,
} from "@/lib/labels";
import { PlaceCard } from "@/components/PlaceCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrackOnMount } from "@/components/TrackOnMount";
import { EditConditionLink } from "@/components/EditConditionLink";

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

  const matches = matchPlaces(condition);
  const topScore = matches[0]?.score ?? 0;
  const allAreaHref = `/results?${conditionToSearchParams({ ...condition, area: "all" }).toString()}`;

  return (
    <div className="flex flex-col gap-5">
      <TrackOnMount
        event="result_viewed"
        props={{ result_count: matches.length, top_score: topScore }}
      />

      <div className="flex items-start justify-between gap-3 rounded-2xl border border-line bg-white p-4">
        <div className="text-sm text-ink-soft">
          <p className="font-medium text-ink">
            {RELATIONSHIP_LABEL[condition.relationship]} · {PEOPLE_LABEL[condition.people]} ·{" "}
            {BUDGET_LABEL[condition.budget]}
          </p>
          <p className="mt-0.5 text-xs text-ink-faint">{AREA_LABEL[condition.area]} 기준</p>
        </div>
        <EditConditionLink resultCount={matches.length} />
      </div>

      <p className="text-sm text-ink-faint">추천 후보 {matches.length}곳</p>

      {matches.length === 0 ? (
        <EmptyState
          title="조건에 딱 맞는 장소를 찾지 못했어요."
          description={"피하고 싶은 조건을 줄이거나\n지역을 넓혀보세요."}
          action={
            <div className="mt-2 flex gap-2">
              <Link
                href="/search"
                className="rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink-soft hover:border-ink-faint"
              >
                조건 수정하기
              </Link>
              <Link
                href={allAreaHref}
                className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-cream hover:bg-ink/90"
              >
                강남권 전체로 보기
              </Link>
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {matches.map((match, index) => (
            <PlaceCard
              key={match.place.id}
              match={match}
              condition={condition}
              rank={index + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
