import { PLACES } from "./places";
import type { Condition, MatchResult, Place, PeopleKey, BudgetKey } from "./types";

/** PRD 11.2 점수 기준의 배점 */
const WEIGHT = {
  relationship: 25,
  people: 15,
  budget: 15,
  mood: 15,
  alcohol: 10,
  access: 10,
  conversation: 10,
  avoidPenaltyCap: 20,
};

const PEOPLE_RANGE: Record<PeopleKey, [number, number]> = {
  "2": [2, 2],
  "3-4": [3, 4],
  "5-6": [5, 6],
  "7+": [7, 99],
};

const BUDGET_RANGE: Record<BudgetKey, [number, number]> = {
  "under-20k": [0, 20000],
  "20-30k": [20000, 30000],
  "30-50k": [30000, 50000],
  "over-50k": [50000, Infinity],
};

function rangesOverlap(a: [number, number], b: [number, number]): boolean {
  return a[0] <= b[1] && b[0] <= a[1];
}

function scoreRelationship(condition: Condition, place: Place): number {
  if (place.relationshipTags.length === 0) return WEIGHT.relationship * 0.5;
  return place.relationshipTags.includes(condition.relationship)
    ? WEIGHT.relationship
    : 0;
}

function scorePeople(condition: Condition, place: Place): number {
  const need = PEOPLE_RANGE[condition.people];
  const has: [number, number] = [place.capacityMin, place.capacityMax];
  return rangesOverlap(need, has) ? WEIGHT.people : 0;
}

function scoreBudget(condition: Condition, place: Place): number {
  const need = BUDGET_RANGE[condition.budget];
  const has: [number, number] = [place.priceMin, place.priceMax];
  return rangesOverlap(need, has) ? WEIGHT.budget : 0;
}

function scoreMood(condition: Condition, place: Place) {
  const matchedMoods = condition.moods.filter((m) =>
    place.moodTags.includes(m),
  );
  if (condition.moods.length === 0) {
    return { score: WEIGHT.mood * 0.6, matchedMoods };
  }
  return {
    score: (matchedMoods.length / condition.moods.length) * WEIGHT.mood,
    matchedMoods,
  };
}

function scoreAlcohol(condition: Condition, place: Place): number {
  const raw =
    condition.alcohol === "with-alcohol" ? place.alcoholFit : place.nonAlcoholFit;
  return (raw / 10) * WEIGHT.alcohol;
}

function scoreAccess(place: Place): number {
  return (place.accessScore / 10) * WEIGHT.access;
}

function scoreConversation(place: Place): number {
  return (place.conversationScore / 10) * WEIGHT.conversation;
}

function scoreAvoidPenalty(condition: Condition, place: Place) {
  const conflictingAvoids = condition.avoid.filter((a) =>
    place.avoidTags.includes(a),
  );
  const penalty = Math.min(
    conflictingAvoids.length * 10,
    WEIGHT.avoidPenaltyCap,
  );
  return { penalty, conflictingAvoids };
}

function fitLabelFor(score: number): MatchResult["fitLabel"] {
  if (score >= 80) return "매우 적합";
  if (score >= 60) return "적합";
  return "보통";
}

/** 조건 하나에 대해 장소 하나의 매칭 점수를 계산한다 (PRD 11.1~11.2) */
export function scorePlace(condition: Condition, place: Place): MatchResult {
  const relationship = scoreRelationship(condition, place);
  const people = scorePeople(condition, place);
  const budget = scoreBudget(condition, place);
  const mood = scoreMood(condition, place);
  const alcohol = scoreAlcohol(condition, place);
  const access = scoreAccess(place);
  const conversation = scoreConversation(place);
  const { penalty, conflictingAvoids } = scoreAvoidPenalty(condition, place);

  const rawScore =
    relationship +
    people +
    budget +
    mood.score +
    alcohol +
    access +
    conversation -
    penalty;

  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  return {
    place,
    score,
    matchedMoods: mood.matchedMoods,
    conflictingAvoids,
    fitLabel: fitLabelFor(score),
    subScores: {
      relationship,
      people,
      budget,
      mood: mood.score,
      alcohol,
      access,
      conversation,
    },
  };
}

/** PRD 11.3 정렬 기준: 총점 → 기피조건 충돌 적은 순 → 역 접근성 → 대화 가능성 */
function compareResults(a: MatchResult, b: MatchResult): number {
  if (b.score !== a.score) return b.score - a.score;
  if (a.conflictingAvoids.length !== b.conflictingAvoids.length) {
    return a.conflictingAvoids.length - b.conflictingAvoids.length;
  }
  if (b.place.accessScore !== a.place.accessScore) {
    return b.place.accessScore - a.place.accessScore;
  }
  return b.place.conversationScore - a.place.conversationScore;
}

/** 이 점수 미만은 "조건에 맞는 후보 없음"으로 간주해 결과에서 제외한다 */
const MIN_SCORE_THRESHOLD = 40;

/** 조건에 맞는 장소를 지역으로 먼저 거르고, 룰 기반 점수로 정렬해 반환한다 */
export function matchPlaces(condition: Condition): MatchResult[] {
  const candidates =
    condition.area === "all"
      ? PLACES
      : PLACES.filter((p) => p.area === condition.area);

  return candidates
    .map((place) => scorePlace(condition, place))
    .filter((match) => match.score >= MIN_SCORE_THRESHOLD)
    .sort(compareResults);
}
