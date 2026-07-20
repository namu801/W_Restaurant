export type RelationshipKey =
  | "close-friend"
  | "friend-group"
  | "coworker"
  | "school-senior"
  | "workplace-senior"
  | "family"
  | "other";

export type PeopleKey = "2" | "3-4" | "5-6" | "7-8" | "9+";

export type AreaKey = "yongsan" | "sinyongsan" | "samgakji" | "all";

/** PRD 8.4: 반열림 구간(하한 포함, 상한 미포함)으로 MECE하게 정의한다 */
export type BudgetKey = "under-20k" | "20-30k" | "30-50k" | "over-50k" | "any";

export type CuisineKey =
  | "korean"
  | "western"
  | "japanese"
  | "chinese"
  | "meat"
  | "seafood"
  | "wine-alcohol"
  | "brunch-cafe"
  | "any";

export type NoiseKey = "quiet" | "lively-but-talkable" | "lively-important" | "any";

export type MoodFormalityKey = "casual" | "balanced" | "hospitable" | "formal" | "any";

/** PRD 8.6 기타 조건: "꼭 필요한" 조건만 모은 다중선택 칩 (선택 입력, 모두 제외 필터로 동작).
 *  예약·웨이팅은 원래 별도 질문이었으나 선택지가 복잡해 "예약 가능한 곳" 한 칩으로 단순화해 여기로 합쳤다 */
export type ExtraConditionKey =
  | "room-required"
  | "parking-required"
  | "wide-seating"
  | "reservation-possible";

/** 조건 입력 단계에서 수집하는 청첩장 모임 조건 */
export interface Condition {
  relationship: RelationshipKey;
  people: PeopleKey;
  area: AreaKey;
  budget: BudgetKey;
  cuisines: CuisineKey[]; // 최대 4개
  noise: NoiseKey;
  moodFormality: MoodFormalityKey;
  extraConditions: ExtraConditionKey[]; // 선택 입력, 0개 이상
}

export type NoiseLevel = "quiet" | "moderate" | "lively";
export type ReservationMethod = "available" | "phone" | "difficult" | "unavailable";
export type ParkingType = "self" | "valet" | "partner" | "none";
export type SeatType = "open" | "wide" | "semi-private" | "room";

/** PRD 10.1 places 스키마와 1:1로 대응하는 장소 모델 */
export interface Place {
  id: string;
  name: string;
  category: string;
  cuisineTags: Exclude<CuisineKey, "any">[];
  area: Exclude<AreaKey, "all">;
  address: string;
  businessHours: string;
  /** public/ 기준 상대경로. 1번 인덱스가 대표 사진. 사진이 없으면 빈 배열(플레이스홀더 아이콘으로 대체) */
  photos: string[];
  /** 지도 탭 마커 표시용 근사 좌표. 실제 매장 위치를 정밀 측량한 값이 아니라 지역대 안에서의
   *  데모용 추정치입니다 (PRD 10.1 참고) */
  lat: number;
  lng: number;
  mapUrlNaver: string;
  mapUrlKakao: string;
  priceMin: number;
  priceMax: number;
  capacityMin: number;
  capacityMax: number;
  relationshipTags: RelationshipKey[];
  formalityTags: Exclude<MoodFormalityKey, "any">[];
  conversationScore: number; // 0~10
  hospitalityScore: number; // 0~10
  serviceScore: number; // 0~10
  accessScore: number; // 0~10
  noiseLevel: NoiseLevel;
  seatType: SeatType;
  spaceScore: number; // 0~10
  privateRoomAvailable: boolean;
  roomMinCapacity?: number;
  roomMinOrderAmount?: number;
  roomTimeLimitMinutes?: number;
  reservationMethod: ReservationMethod;
  waitingRisk: number; // 0~10
  parkingAvailable: boolean;
  parkingType: ParkingType;
  curatedReason: string;
  cautionNote: string;
  lastVerifiedAt: string; // ISO date
}

export type ScoreCategory =
  | "relationship"
  | "people"
  | "budget"
  | "access"
  | "food"
  | "conversation"
  | "mood"
  | "seat"
  | "reservation"
  | "parking";

/** 룰 기반 매칭 결과 (PRD 11) */
export interface MatchResult {
  place: Place;
  score: number; // 0~maxPossible(조건별 가변), 내부 정렬용
  maxPossible: number;
  fitRatio: number; // score / maxPossible
  fitLabel: "매우 잘 맞아요" | "잘 맞아요" | "일부 조건을 확인해보세요";
  subScores: Record<ScoreCategory, number>; // 카테고리별 0~weight (가중치 반영된 절대 기여도)
  ratios: Record<ScoreCategory, number>; // 카테고리별 0~1 적합 비율 (가중치와 무관, 카테고리 간 비교용)
}

export type FeedbackValue = "helpful" | "not_helpful";
