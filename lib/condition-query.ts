import {
  AREA_OPTIONS,
  BUDGET_OPTIONS,
  CUISINE_OPTIONS,
  EXTRA_CONDITION_OPTIONS,
  MOOD_FORMALITY_OPTIONS,
  NOISE_OPTIONS,
  PEOPLE_OPTIONS,
  RELATIONSHIP_OPTIONS,
  VIBE_CONDITION,
  VIBE_OPTIONS,
} from "./labels";
import type { Condition, MoodFormalityKey, NoiseKey, VibeKey } from "./types";

const SINGLE_KEYS = ["relationship", "people", "area", "budget"] as const;

const SINGLE_OPTIONS: Record<(typeof SINGLE_KEYS)[number], readonly string[]> = {
  relationship: RELATIONSHIP_OPTIONS,
  people: PEOPLE_OPTIONS,
  area: AREA_OPTIONS,
  budget: BUDGET_OPTIONS,
};

/** 분위기 카드(vibe)를 고르기 전에 만들어진 예전 링크는 noise·moodFormality만 갖고 있다.
 *  그 두 값이 어느 카드와 정확히 같으면 그 카드로, 아니면 "상관없음"으로 본다 */
function inferVibe(noise: NoiseKey, moodFormality: MoodFormalityKey): VibeKey {
  const hit = VIBE_OPTIONS.find(
    (v) => VIBE_CONDITION[v].noise === noise && VIBE_CONDITION[v].moodFormality === moodFormality,
  );
  return hit ?? "any";
}

/** 조건을 URL 쿼리스트링으로 직렬화한다 (단계 간, 결과/상세 화면 간 공유 가능한 링크를 위해).
 *  분위기 카드를 골랐으면 noise·moodFormality를 그 카드에서 다시 계산해 넣는다 — 필터 시트에서
 *  분위기만 바꿔도 점수 계산용 값이 어긋나지 않게. "상관없음"이면 조건에 든 값을 그대로 둔다
 *  (카드와 안 맞는 조합을 가진 예전 링크가 화면을 옮겨 다니며 값이 바뀌지 않게) */
export function conditionToSearchParams(condition: Condition): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of SINGLE_KEYS) {
    params.set(key, condition[key]);
  }
  const derived =
    condition.vibe === "any"
      ? { noise: condition.noise, moodFormality: condition.moodFormality }
      : VIBE_CONDITION[condition.vibe];
  params.set("vibe", condition.vibe);
  params.set("noise", derived.noise);
  params.set("moodFormality", derived.moodFormality);
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

  // 분위기: vibe가 있으면 그걸로 noise·moodFormality를 정하고, 없으면(예전 링크) noise·
  // moodFormality를 그대로 읽어서 가장 가까운 카드를 추정한다
  const vibeRaw = getParam(searchParams, "vibe");
  let vibe: VibeKey;
  let noise: NoiseKey;
  let moodFormality: MoodFormalityKey;
  if (vibeRaw && VIBE_OPTIONS.includes(vibeRaw as VibeKey)) {
    vibe = vibeRaw as VibeKey;
    ({ noise, moodFormality } = VIBE_CONDITION[vibe]);
  } else {
    const noiseRaw = getParam(searchParams, "noise");
    const moodRaw = getParam(searchParams, "moodFormality");
    if (!noiseRaw || !NOISE_OPTIONS.includes(noiseRaw as NoiseKey)) return null;
    if (!moodRaw || !MOOD_FORMALITY_OPTIONS.includes(moodRaw as MoodFormalityKey)) return null;
    noise = noiseRaw as NoiseKey;
    moodFormality = moodRaw as MoodFormalityKey;
    vibe = inferVibe(noise, moodFormality);
  }

  const cuisinesRaw = getParam(searchParams, "cuisines");
  const extraRaw = getParam(searchParams, "extra");

  let cuisines = (cuisinesRaw ? cuisinesRaw.split(",") : []).filter((v) =>
    CUISINE_OPTIONS.includes(v as never),
  ) as Condition["cuisines"];
  const extraConditions = (extraRaw ? extraRaw.split(",") : []).filter((v) =>
    EXTRA_CONDITION_OPTIONS.includes(v as never),
  ) as Condition["extraConditions"];

  // 예전 링크의 음식 "와인·주류"는 이제 음식 종류가 아니라 "술도 곁들여요"(가점)다
  if (cuisines.includes("wine-alcohol")) {
    cuisines = cuisines.filter((c) => c !== "wine-alcohol");
    if (cuisines.length === 0) cuisines = ["any"];
    if (!extraConditions.includes("with-drinks")) extraConditions.push("with-drinks");
  }

  return {
    relationship: values.relationship as Condition["relationship"],
    people: values.people as Condition["people"],
    area: values.area as Condition["area"],
    budget: values.budget as Condition["budget"],
    cuisines,
    vibe,
    noise,
    moodFormality,
    extraConditions,
  };
}
