export type RelationshipKey =
  | "close-friend"
  | "friend-group"
  | "coworker"
  | "senior"
  | "family"
  | "other";

export type PeopleKey = "2" | "3-4" | "5-6" | "7+";

export type BudgetKey = "under-20k" | "20-30k" | "30-50k" | "over-50k";

export type AlcoholKey = "no-alcohol" | "with-alcohol";

export type MoodKey =
  | "quiet-talk"
  | "not-too-much"
  | "hospitable"
  | "casual-sincere"
  | "long-stay"
  | "stable-service";

export type AvoidKey =
  | "long-wait"
  | "hard-reservation"
  | "too-loud"
  | "too-expensive"
  | "too-casual"
  | "too-formal"
  | "far-from-station"
  | "bar-like";

export type AreaKey = "gangnam" | "sinnonhyeon" | "nonhyeon" | "all";

/** 조건 입력 화면(8.2)에서 수집하는 청첩장 모임 조건 */
export interface Condition {
  relationship: RelationshipKey;
  people: PeopleKey;
  budget: BudgetKey;
  alcohol: AlcoholKey;
  moods: MoodKey[];
  avoid: AvoidKey[];
  area: AreaKey;
}

/** PRD 10.1 places 스키마와 1:1로 대응하는 장소 모델 */
export interface Place {
  id: string;
  name: string;
  category: string;
  area: Exclude<AreaKey, "all">;
  address: string;
  mapUrlNaver: string;
  mapUrlKakao: string;
  priceMin: number;
  priceMax: number;
  capacityMin: number;
  capacityMax: number;
  relationshipTags: RelationshipKey[];
  moodTags: MoodKey[];
  avoidTags: AvoidKey[];
  alcoholFit: number; // 0~10
  nonAlcoholFit: number; // 0~10
  conversationScore: number; // 0~10
  hospitalityScore: number; // 0~10
  accessScore: number; // 0~10
  reservationDifficulty: number; // 0~10, 높을수록 예약 어려움
  waitingRisk: number; // 0~10, 높을수록 웨이팅 위험
  serviceScore: number; // 0~10
  privateRoomAvailable: boolean;
  curatedReason: string;
  cautionNote: string;
  lastVerifiedAt: string; // ISO date
}

/** 룰 기반 매칭 결과 */
export interface MatchResult {
  place: Place;
  score: number; // 0~100
  matchedMoods: MoodKey[];
  conflictingAvoids: AvoidKey[];
  fitLabel: "매우 적합" | "적합" | "보통";
  subScores: {
    relationship: number;
    people: number;
    budget: number;
    mood: number;
    alcohol: number;
    access: number;
    conversation: number;
  };
}

export type FeedbackValue = "helpful" | "not_helpful";
