import { PLACES } from "./places";
import type {
  BudgetKey,
  Condition,
  MatchResult,
  MoodFormalityKey,
  NoiseKey,
  NoiseLevel,
  Place,
  PeopleKey,
  RelationshipKey,
  ScoreCategory,
} from "./types";

/** PRD 11.3 점수 반영 조건의 기본 배점 (술 여부 제외, 예약·웨이팅 통합, 합계 97) */
const BASE_WEIGHTS: Record<ScoreCategory, number> = {
  relationship: 15,
  people: 10,
  budget: 15,
  access: 10,
  food: 10,
  conversation: 10,
  mood: 10,
  seat: 8,
  reservation: 7,
  parking: 2,
};

/** PRD 11.5 관계별 가중치 보정: 상대적으로 높게 반영할 기준 */
const RELATIONSHIP_BOOST: Record<RelationshipKey, ScoreCategory[]> = {
  "close-friend": ["access", "budget", "mood", "seat"],
  "friend-group": ["food", "people", "access"],
  coworker: ["access", "conversation", "budget", "reservation"],
  "school-senior": ["food", "mood", "conversation"],
  "workplace-senior": ["mood", "conversation", "reservation"],
  family: ["food", "seat", "parking", "mood"],
  other: [],
};

/** PRD 11.6 5명 이상일 때 가중치가 증가하는 기준 */
const PEOPLE_BOOST_CATEGORIES: ScoreCategory[] = ["reservation", "seat"];
const PEOPLE_BOOST_TIERS = new Set<PeopleKey>(["5-6", "7-8", "9+"]);

const BOOST_MULTIPLIER = 1.15;

/** 분위기 카드를 직접 골랐을 때 분위기 배점을 키우는 배수. 배점 10에 응대 점수까지 섞여 있어
 *  분위기 몫이 전체의 5%쯤이었고, 어떤 카드를 골라도 상위 식당이 거의 같았다 */
const VIBE_PICKED_MULTIPLIER = 2;

const PEOPLE_RANGE: Record<PeopleKey, [number, number]> = {
  "2": [2, 2],
  "3-4": [3, 4],
  "5-6": [5, 6],
  "7-8": [7, 8],
  "9+": [9, 99],
};

/** PRD 8.4: 하한 포함·상한 미포함의 반열림 구간 */
const BUDGET_RANGE: Record<Exclude<BudgetKey, "any">, [number, number]> = {
  "under-20k": [0, 20000],
  "20-30k": [20000, 30000],
  "30-50k": [30000, 50000],
  "over-50k": [50000, Infinity],
};

function rangesOverlap(a: [number, number], b: [number, number]): boolean {
  return a[0] <= b[1] && b[0] <= a[1];
}

function computeWeights(condition: Condition): Record<ScoreCategory, number> {
  const weights = { ...BASE_WEIGHTS };

  for (const cat of RELATIONSHIP_BOOST[condition.relationship]) {
    weights[cat] *= BOOST_MULTIPLIER;
  }
  if (PEOPLE_BOOST_TIERS.has(condition.people)) {
    for (const cat of PEOPLE_BOOST_CATEGORIES) weights[cat] *= BOOST_MULTIPLIER;
  }
  if (condition.vibe !== "any") weights.mood *= VIBE_PICKED_MULTIPLIER;

  return weights;
}

function fitPeople(condition: Condition, place: Place): number | null {
  const need = PEOPLE_RANGE[condition.people];
  const has: [number, number] = [place.capacityMin, place.capacityMax];
  if (!rangesOverlap(need, has)) return null;
  const contained = need[0] >= has[0] && need[1] <= has[1];
  return contained ? 1 : 0.7;
}

function fitBudget(condition: Condition, place: Place): { ratio: number; excluded: boolean } {
  if (condition.budget === "any") return { ratio: 0.7, excluded: false };
  const need = BUDGET_RANGE[condition.budget];
  const has: [number, number] = [place.priceMin, place.priceMax];
  if (!rangesOverlap(need, has)) {
    // 예산보다 최대 10~15% 초과: 낮은 점수로 유지, 크게 초과하면 제외
    if (place.priceMin <= need[1] * 1.15) return { ratio: 0.35, excluded: false };
    return { ratio: 0, excluded: true };
  }
  const contained =
    (need[0] <= has[0] && has[1] <= need[1]) || (has[0] <= need[0] && need[1] <= has[1]);
  return { ratio: contained ? 1 : 0.75, excluded: false };
}

function fitRelationship(condition: Condition, place: Place): number {
  if (condition.relationship === "other") return 0.6;
  if (place.relationshipTags.length === 0) return 0.5;
  return place.relationshipTags.includes(condition.relationship) ? 1 : 0;
}

function fitCuisine(condition: Condition, place: Place): number {
  const selected = condition.cuisines.filter((c) => c !== "any");
  if (condition.cuisines.includes("any") || selected.length === 0) return 0.65;
  const matched = selected.filter((c) => place.cuisineTags.includes(c));
  return matched.length === 0 ? 0.2 : matched.length / selected.length;
}

/** "술도 곁들여요"는 제외 필터가 아니라 가점이다 — 술을 곁들이기 좋은 곳(wine-alcohol 태그)이면
 *  음식 점수의 20%를 채워주고, 아니면 그만큼 덜 받는다. 술을 안 파는 곳이 결과에서 빠지진 않는다 */
const DRINKS_SHARE = 0.2;

function fitFood(condition: Condition, place: Place): number {
  const cuisine = fitCuisine(condition, place);
  if (!condition.extraConditions.includes("with-drinks")) return cuisine;
  const drinks = place.cuisineTags.includes("wine-alcohol") ? 1 : 0;
  return cuisine * (1 - DRINKS_SHARE) + drinks * DRINKS_SHARE;
}

/** "콜키지 프리"도 가점이다. 콜키지 정책은 확인된 매장이 적어서, 제외 필터로 걸면 확인 안 된
 *  곳이 전부 빠진다. 확인된 프리는 채워주고, 모르는 곳은 절반, 유료·불가는 0으로 본다 */
const CORKAGE_SHARE = 0.15;
const CORKAGE_FIT = { free: 1, paid: 0.3, unavailable: 0 } as const;

function fitFoodWithCorkage(condition: Condition, place: Place): number {
  const food = fitFood(condition, place);
  if (!condition.extraConditions.includes("corkage-free")) return food;
  const corkage = place.corkage ? CORKAGE_FIT[place.corkage] : 0.5;
  return food * (1 - CORKAGE_SHARE) + corkage * CORKAGE_SHARE;
}

const NOISE_MATCH: Record<Exclude<NoiseKey, "any">, Record<NoiseLevel, number>> = {
  quiet: { quiet: 1, moderate: 0.5, lively: 0.1 },
  "lively-but-talkable": { quiet: 0.8, moderate: 1, lively: 0.4 },
  "lively-important": { quiet: 0.2, moderate: 0.6, lively: 1 },
};

function fitConversation(condition: Condition, place: Place): number {
  const base = place.conversationScore / 10;
  if (condition.noise === "any") return base;
  const noiseRatio = NOISE_MATCH[condition.noise as Exclude<NoiseKey, "any">][place.noiseLevel];
  return (base + noiseRatio) / 2;
}

/** 격식 태그 일치. 정성스러운 자리를 원하면 격식 있는 곳도 맞는 것으로 본다(더 높은 쪽은 괜찮다) */
function formalityMatch(want: MoodFormalityKey, place: Place): number {
  if (want === "any") return 0.7;
  if (place.formalityTags.includes(want)) return 1;
  if (want === "hospitable" && place.formalityTags.includes("formal")) return 1;
  return 0.3;
}

function fitMood(condition: Condition, place: Place): number {
  // 트렌디 카드는 격식이 아니라 공간·콘셉트의 감성을 본다 — 격식 자리에 trendScore를 쓴다
  const vibeFit =
    condition.vibe === "trendy" ? place.trendScore / 10 : formalityMatch(condition.moodFormality, place);
  const service = (place.hospitalityScore + place.serviceScore) / 20;
  // 카드를 직접 골랐으면 그 분위기가 맞는지를 응대보다 크게 본다
  return condition.vibe === "any" ? (vibeFit + service) / 2 : vibeFit * 0.75 + service * 0.25;
}

/** 좌석 여유는 항상 spaceScore를 반영한다. "꼭 필요한" 좌석 형태는 기타 조건 칩에서 제외 필터로 처리한다 */
function fitSeat(place: Place): number {
  return place.spaceScore / 10;
}

/** 예약·웨이팅은 더 이상 별도 질문이 아니라 항상 place 데이터 기준으로 매긴다.
 *  "예약 가능한 곳"을 꼭 필요로 하는 경우는 기타 조건 칩에서 제외 필터로 처리한다 */
function fitReservation(place: Place): number {
  const methodRatio =
    place.reservationMethod === "available"
      ? 1
      : place.reservationMethod === "phone"
        ? 0.8
        : place.reservationMethod === "difficult"
          ? 0.5
          : 0.4;
  const waitingRatio = 1 - place.waitingRisk / 10;
  return (methodRatio + waitingRatio) / 2;
}

/** 주차는 항상 parkingAvailable을 반영한다. "꼭 필요함"은 기타 조건 칩에서 제외 필터로 처리한다 */
function fitParking(place: Place): number {
  return place.parkingAvailable ? 1 : 0.5;
}

/** PRD 11.2 결과 제외 조건: 필수 조건과 충돌하는 장소를 제외한다.
 *  음식 취향은 원래 점수에만 반영되는 가중치였다(fitFood) — 완전히 안 맞는 카테고리라도
 *  다른 항목 점수가 좋으면 상위권에 뜰 수 있었다. "선택한 음식과 아예 안 맞으면 왜 나오지?"
 *  라는 실제 사용자 피드백을 받고, 지역·인원·예산처럼 하드 필터로 바꿨다 — "상관없음"을
 *  포함했거나 아무것도 안 골랐으면(둘 다 "선호 없음") 그대로 전부 통과시킨다 */
function isExcluded(condition: Condition, place: Place): boolean {
  if (condition.area !== "all" && place.area !== condition.area) return true;
  if (fitPeople(condition, place) === null) return true;
  if (fitBudget(condition, place).excluded) return true;
  const selectedCuisines = condition.cuisines.filter((c) => c !== "any");
  if (selectedCuisines.length > 0 && !selectedCuisines.some((c) => place.cuisineTags.includes(c))) {
    return true;
  }
  for (const extra of condition.extraConditions) {
    switch (extra) {
      case "room-required":
        if (!place.privateRoomAvailable) return true;
        break;
      case "parking-required":
        if (!place.parkingAvailable) return true;
        break;
      case "wide-seating":
        if (place.spaceScore < 6) return true;
        break;
      case "reservation-possible":
        if (place.reservationMethod === "unavailable") return true;
        break;
    }
  }
  return false;
}

function fitLabelFor(ratio: number): MatchResult["fitLabel"] {
  if (ratio >= 0.75) return "매우 잘 맞아요";
  if (ratio >= 0.55) return "잘 맞아요";
  return "일부 조건을 확인해보세요";
}

/** 제외 조건 여부와 무관하게 항상 매칭 점수를 계산한다. scorePlace(정상 경로)와
 *  findNearMissMatches(0곳일 때 그나마 가까운 후보 찾기) 둘 다 이 계산을 그대로 쓴다 */
function computeMatch(condition: Condition, place: Place): MatchResult {
  const weights = computeWeights(condition);
  const ratios: Record<ScoreCategory, number> = {
    relationship: fitRelationship(condition, place),
    people: fitPeople(condition, place) ?? 0,
    budget: fitBudget(condition, place).ratio,
    access: place.accessScore / 10,
    food: fitFoodWithCorkage(condition, place),
    conversation: fitConversation(condition, place),
    mood: fitMood(condition, place),
    seat: fitSeat(place),
    reservation: fitReservation(place),
    parking: fitParking(place),
  };

  const subScores = {} as Record<ScoreCategory, number>;
  let rawScore = 0;
  let maxPossible = 0;
  (Object.keys(weights) as ScoreCategory[]).forEach((cat) => {
    const contribution = ratios[cat] * weights[cat];
    subScores[cat] = Math.round(contribution * 10) / 10;
    rawScore += contribution;
    maxPossible += weights[cat];
  });

  const fitRatio = maxPossible > 0 ? rawScore / maxPossible : 0;

  return {
    place,
    score: Math.round(rawScore * 10) / 10,
    maxPossible: Math.round(maxPossible * 10) / 10,
    fitRatio,
    fitLabel: fitLabelFor(fitRatio),
    subScores,
    ratios,
  };
}

/** 조건 하나에 대해 장소 하나의 매칭 점수를 계산한다. 제외 조건에 해당하면 null (PRD 11.1~11.3) */
export function scorePlace(condition: Condition, place: Place): MatchResult | null {
  if (isExcluded(condition, place)) return null;
  return computeMatch(condition, place);
}

/** PRD 11.9 정렬 기준: 총점 → 역 접근성 → 대화 가능성 */
function compareResults(a: MatchResult, b: MatchResult): number {
  if (b.fitRatio !== a.fitRatio) return b.fitRatio - a.fitRatio;
  if (b.place.accessScore !== a.place.accessScore) {
    return b.place.accessScore - a.place.accessScore;
  }
  return b.place.conversationScore - a.place.conversationScore;
}

/** 조건에 맞는 장소를 제외 조건으로 거르고, 룰 기반 점수로 정렬해 반환한다 */
export function matchPlaces(condition: Condition): MatchResult[] {
  return PLACES.map((place) => scorePlace(condition, place))
    .filter((match): match is MatchResult => match !== null)
    .sort(compareResults);
}

/** 결과 목록(8.8)에서 한 번에 보여줄 상한과, 그 이상일 때 우선 노출할 개수 (PRD 13.3) */
export const RESULT_TRUNCATE_THRESHOLD = 8;
export const RESULT_DISPLAY_LIMIT = 6;

/** "조건이 지나치게 좁다"고 판단하는 후보 수 기준 (PRD 13.1) */
export const NARROW_RESULT_THRESHOLD = 2;

interface RelaxationCandidate {
  label: string;
  next: Condition;
}

/** 결과가 0개일 때(PRD 13.2) 필수 조건을 지역 → 예산 → 기타 조건 순으로 하나씩 완화해보고 제안한다 */
export function findRelaxationSuggestion(
  condition: Condition,
): { message: string; condition: Condition } | null {
  const candidates: RelaxationCandidate[] = [];

  if (condition.area !== "all") {
    candidates.push({
      label: "지역을 용산권 전체로 넓히면",
      next: { ...condition, area: "all" },
    });
  }
  if (condition.budget !== "any") {
    candidates.push({
      label: "예산 조건을 '상관없어요'로 넓히면",
      next: { ...condition, budget: "any" },
    });
  }
  // 음식 취향이 이제 하드 필터라(isExcluded 참고), 너무 좁게 고르면 0곳이 나올 수 있다 —
  // 다른 필수 조건과 같은 자리에서 완화 후보로 제안한다
  const selectedCuisines = condition.cuisines.filter((c) => c !== "any");
  if (selectedCuisines.length > 0) {
    candidates.push({
      label: "음식 조건을 '상관없어요'로 넓히면",
      next: { ...condition, cuisines: ["any"] },
    });
  }
  const EXTRA_RELAX_LABEL: Record<Condition["extraConditions"][number], string> = {
    "room-required": "'룸 필수' 조건을 해제하면",
    "parking-required": "'주차 필수' 조건을 해제하면",
    "wide-seating": "'좌석 간격' 조건을 해제하면",
    "reservation-possible": "'예약 가능' 조건을 해제하면",
    "with-drinks": "",
    "corkage-free": "",
  };
  for (const extra of condition.extraConditions) {
    if (extra === "with-drinks" || extra === "corkage-free") continue; // 가점이라 결과를 줄이지 않는다 — 완화할 이유가 없다
    candidates.push({
      label: EXTRA_RELAX_LABEL[extra],
      next: { ...condition, extraConditions: condition.extraConditions.filter((e) => e !== extra) },
    });
  }

  let best: { label: string; condition: Condition; count: number } | null = null;
  for (const candidate of candidates) {
    const count = matchPlaces(candidate.next).length;
    if (count > 0 && (!best || count > best.count)) {
      best = { label: candidate.label, condition: candidate.next, count };
    }
  }
  if (!best) return null;
  return { message: `${best.label} ${best.count}곳을 더 볼 수 있어요.`, condition: best.condition };
}

/** isExcluded와 같은 순서로 검사해서, 왜 이 장소가 제외됐는지 사람이 읽을 문장으로 돌려준다.
 *  findNearMissMatches 전용 — 정상 매칭 경로(scorePlace)는 이유가 필요 없어 그대로 둔다 */
/** 카드 위 topBand 띠에 얹을 자리라 짧은 명사형으로 통일한다(문장형 아님) */
function describeViolations(condition: Condition, place: Place): string[] {
  const reasons: string[] = [];
  if (condition.area !== "all" && place.area !== condition.area) {
    reasons.push("지역 조건 밖");
  }
  if (fitPeople(condition, place) === null) {
    reasons.push("인원 규모 불일치");
  }
  if (fitBudget(condition, place).excluded) {
    reasons.push("예산 범위 초과");
  }
  const selectedCuisines = condition.cuisines.filter((c) => c !== "any");
  if (selectedCuisines.length > 0 && !selectedCuisines.some((c) => place.cuisineTags.includes(c))) {
    reasons.push("음식 종류 불일치");
  }
  for (const extra of condition.extraConditions) {
    if (extra === "room-required" && !place.privateRoomAvailable) reasons.push("룸 없음");
    if (extra === "parking-required" && !place.parkingAvailable) reasons.push("주차 불가");
    if (extra === "wide-seating" && place.spaceScore < 6) reasons.push("좌석 간격 부족");
    if (extra === "reservation-possible" && place.reservationMethod === "unavailable") {
      reasons.push("예약 불가");
    }
  }
  return reasons;
}

export interface NearMissMatch {
  match: MatchResult;
  /** 이 장소가 왜 조건에서 제외됐는지(한 개 이상일 수 있다) */
  violations: string[];
}

/** 결과가 0개일 때 "그래도 가장 가까운 후보"를 보여주기 위해, 제외 조건을 무시하고 전체
 *  장소를 점수순으로 훑어 상위 N곳을 돌려준다. isExcluded를 통과한(=진짜 매칭된) 곳은
 *  애초에 여기 부를 일이 없는 상황(0곳)이지만, 방어적으로 실제 제외 사유가 있는
 *  장소만 후보로 남긴다 */
export function findNearMissMatches(condition: Condition, limit: number): NearMissMatch[] {
  return PLACES.map((place) => ({
    match: computeMatch(condition, place),
    violations: describeViolations(condition, place),
  }))
    .filter((r) => r.violations.length > 0)
    .sort((a, b) => b.match.fitRatio - a.match.fitRatio)
    .slice(0, limit);
}
