import {
  AREA_OPTIONS,
  BUDGET_OPTIONS,
  CUISINE_OPTIONS,
  EXTRA_CONDITION_OPTIONS,
  MOOD_FORMALITY_OPTIONS,
  NOISE_OPTIONS,
  PEOPLE_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from "./labels";
import type { Condition } from "./types";

const SINGLE_KEYS = ["relationship", "people", "area", "budget", "noise", "moodFormality"] as const;

const SINGLE_OPTIONS: Record<(typeof SINGLE_KEYS)[number], readonly string[]> = {
  relationship: RELATIONSHIP_OPTIONS,
  people: PEOPLE_OPTIONS,
  area: AREA_OPTIONS,
  budget: BUDGET_OPTIONS,
  noise: NOISE_OPTIONS,
  moodFormality: MOOD_FORMALITY_OPTIONS,
};

/** 조건을 URL 쿼리스트링으로 직렬화한다 (단계 간, 결과/상세 화면 간 공유 가능한 링크를 위해) */
export function conditionToSearchParams(condition: Condition): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of SINGLE_KEYS) {
    params.set(key, condition[key]);
  }
  if (condition.cuisines.length > 0) params.set("cuisines", condition.cuisines.join(","));
  if (condition.extraConditions.length > 0) {
    params.set("extra", condition.extraConditions.join(","));
  }
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
export function searchParamsToCondition(searchParams: SearchParamsLike): Condition | null {
  const values: Record<string, string> = {};
  for (const key of SINGLE_KEYS) {
    const raw = getParam(searchParams, key);
    if (!raw || !SINGLE_OPTIONS[key].includes(raw)) return null;
    values[key] = raw;
  }

  const cuisinesRaw = getParam(searchParams, "cuisines");
  const extraRaw = getParam(searchParams, "extra");

  const cuisines = (cuisinesRaw ? cuisinesRaw.split(",") : []).filter((v) =>
    CUISINE_OPTIONS.includes(v as never),
  ) as Condition["cuisines"];
  const extraConditions = (extraRaw ? extraRaw.split(",") : []).filter((v) =>
    EXTRA_CONDITION_OPTIONS.includes(v as never),
  ) as Condition["extraConditions"];

  return {
    relationship: values.relationship as Condition["relationship"],
    people: values.people as Condition["people"],
    area: values.area as Condition["area"],
    budget: values.budget as Condition["budget"],
    cuisines,
    noise: values.noise as Condition["noise"],
    moodFormality: values.moodFormality as Condition["moodFormality"],
    extraConditions,
  };
}
