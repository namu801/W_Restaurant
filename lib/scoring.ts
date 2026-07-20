import { PLACES } from "./places";
import type {
  BudgetKey,
  Condition,
  MatchResult,
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

function fitFood(condition: Condition, place: Place): number {
  const selected = condition.cuisines.filter((c) => c !== "any");
  if (condition.cuisines.includes("any") || selected.length === 0) return 0.65;
  const matched = selected.filter((c) => place.cuisineTags.includes(c));
  return matched.length === 0 ? 0.2 : matched.length / selected.length;
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

function fitMood(condition: Condition, place: Place): number {
  const formality =
    condition.moodFormality === "any"
      ? 0.7
      : place.formalityTags.includes(condition.moodFormality)
        ? 1
        : 0.3;
  const service = (place.hospitalityScore + place.serviceScore) / 20;
  return (formality + service) / 2;
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

/** PRD 11.2 결과 제외 조건: 필수 조건과 충돌하는 장소를 제외한다 */
function isExcluded(condition: Condition, place: Place): boolean {
  if (condition.area !== "all" && place.area !== condition.area) return true;
  if (fitPeople(condition, place) === null) return true;
  if (fitBudget(condition, place).excluded) return true;
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

/** 조건 하나에 대해 장소 하나의 매칭 점수를 계산한다. 제외 조건에 해당하면 null (PRD 11.1~11.3) */
export function scorePlace(condition: Condition, place: Place): MatchResult | null {
  if (isExcluded(condition, place)) return null;

  const weights = computeWeights(condition);
  const ratios: Record<ScoreCategory, number> = {
    relationship: fitRelationship(condition, place),
    people: fitPeople(condition, place) ?? 0,
    budget: fitBudget(condition, place).ratio,
    access: place.accessScore / 10,
    food: fitFood(condition, place),
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
  const EXTRA_RELAX_LABEL: Record<Condition["extraConditions"][number], string> = {
    "room-required": "'룸 필수' 조건을 해제하면",
    "parking-required": "'주차 필수' 조건을 해제하면",
    "wide-seating": "'좌석 간격' 조건을 해제하면",
    "reservation-possible": "'예약 가능' 조건을 해제하면",
  };
  for (const extra of condition.extraConditions) {
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
