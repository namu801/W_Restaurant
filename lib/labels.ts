import type {
  AlcoholKey,
  AreaKey,
  AvoidKey,
  BudgetKey,
  MoodKey,
  PeopleKey,
  RelationshipKey,
} from "./types";

export const RELATIONSHIP_LABEL: Record<RelationshipKey, string> = {
  "close-friend": "친한 친구",
  "friend-group": "친구 모임",
  coworker: "직장 동료",
  senior: "선배/상사",
  family: "가족/친척",
  other: "기타",
};

export const PEOPLE_LABEL: Record<PeopleKey, string> = {
  "2": "2명",
  "3-4": "3~4명",
  "5-6": "5~6명",
  "7+": "7명 이상",
};

export const BUDGET_LABEL: Record<BudgetKey, string> = {
  "under-20k": "2만원 이하",
  "20-30k": "2~3만원",
  "30-50k": "3~5만원",
  "over-50k": "5만원 이상",
};

export const ALCOHOL_LABEL: Record<AlcoholKey, string> = {
  "no-alcohol": "술 없이 식사 중심",
  "with-alcohol": "술 함께 마시는 자리",
};

export const MOOD_LABEL: Record<MoodKey, string> = {
  "quiet-talk": "조용히 대화하기 좋은",
  "not-too-much": "너무 부담스럽지 않은",
  hospitable: "적당히 대접하는 느낌",
  "casual-sincere": "캐주얼하지만 성의 있어 보이는",
  "long-stay": "오래 앉아 있기 좋은",
  "stable-service": "서비스가 안정적인",
};

export const AVOID_LABEL: Record<AvoidKey, string> = {
  "long-wait": "웨이팅이 긴 곳",
  "hard-reservation": "예약이 너무 어려운 곳",
  "too-loud": "너무 시끄러운 곳",
  "too-expensive": "너무 비싼 곳",
  "too-casual": "너무 가벼운 분위기",
  "too-formal": "너무 딱딱한 분위기",
  "far-from-station": "역에서 먼 곳",
  "bar-like": "술집 느낌이 강한 곳",
};

export const AREA_LABEL: Record<AreaKey, string> = {
  gangnam: "강남역",
  sinnonhyeon: "신논현",
  nonhyeon: "논현",
  all: "강남권 전체",
};

export const RELATIONSHIP_OPTIONS = Object.keys(
  RELATIONSHIP_LABEL,
) as RelationshipKey[];
export const PEOPLE_OPTIONS = Object.keys(PEOPLE_LABEL) as PeopleKey[];
export const BUDGET_OPTIONS = Object.keys(BUDGET_LABEL) as BudgetKey[];
export const ALCOHOL_OPTIONS = Object.keys(ALCOHOL_LABEL) as AlcoholKey[];
export const MOOD_OPTIONS = Object.keys(MOOD_LABEL) as MoodKey[];
export const AVOID_OPTIONS = Object.keys(AVOID_LABEL) as AvoidKey[];
export const AREA_OPTIONS = Object.keys(AREA_LABEL) as AreaKey[];

export function formatPrice(min: number, max: number): string {
  const fmt = (n: number) => `${Math.round(n / 1000)}천원`;
  return `${fmt(min)}~${fmt(max)}`;
}
