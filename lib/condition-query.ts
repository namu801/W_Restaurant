import {
  ALCOHOL_OPTIONS,
  AREA_OPTIONS,
  AVOID_OPTIONS,
  BUDGET_OPTIONS,
  MOOD_OPTIONS,
  PEOPLE_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from "./labels";
import type { Condition } from "./types";

/** 조건을 URL 쿼리스트링으로 직렬화한다 (결과/상세 화면 간 공유 가능한 링크를 위해) */
export function conditionToSearchParams(condition: Condition): URLSearchParams {
  const params = new URLSearchParams();
  params.set("relationship", condition.relationship);
  params.set("people", condition.people);
  params.set("budget", condition.budget);
  params.set("alcohol", condition.alcohol);
  params.set("area", condition.area);
  if (condition.moods.length > 0) params.set("moods", condition.moods.join(","));
  if (condition.avoid.length > 0) params.set("avoid", condition.avoid.join(","));
  return params;
}

type SearchParamsLike = URLSearchParams | Record<string, string | string[] | undefined>;

function getParam(searchParams: SearchParamsLike, key: string): string | undefined {
  if (searchParams instanceof URLSearchParams) {
    return searchParams.get(key) ?? undefined;
  }
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

/** 쿼리스트링에서 조건을 복원한다. 필수값이 없거나 유효하지 않으면 null을 반환한다 */
export function searchParamsToCondition(
  searchParams: SearchParamsLike,
): Condition | null {
  const relationship = getParam(searchParams, "relationship");
  const people = getParam(searchParams, "people");
  const budget = getParam(searchParams, "budget");
  const alcohol = getParam(searchParams, "alcohol");
  const area = getParam(searchParams, "area");
  const moodsRaw = getParam(searchParams, "moods");
  const avoidRaw = getParam(searchParams, "avoid");

  if (
    !relationship ||
    !people ||
    !budget ||
    !alcohol ||
    !area ||
    !RELATIONSHIP_OPTIONS.includes(relationship as never) ||
    !PEOPLE_OPTIONS.includes(people as never) ||
    !BUDGET_OPTIONS.includes(budget as never) ||
    !ALCOHOL_OPTIONS.includes(alcohol as never) ||
    !AREA_OPTIONS.includes(area as never)
  ) {
    return null;
  }

  const moods = (moodsRaw ? moodsRaw.split(",") : []).filter((m) =>
    MOOD_OPTIONS.includes(m as never),
  ) as Condition["moods"];
  const avoid = (avoidRaw ? avoidRaw.split(",") : []).filter((a) =>
    AVOID_OPTIONS.includes(a as never),
  ) as Condition["avoid"];

  return {
    relationship: relationship as Condition["relationship"],
    people: people as Condition["people"],
    budget: budget as Condition["budget"],
    alcohol: alcohol as Condition["alcohol"],
    area: area as Condition["area"],
    moods,
    avoid,
  };
}
