import type {
  AreaKey,
  BudgetKey,
  CuisineKey,
  ExtraConditionKey,
  MoodFormalityKey,
  NoiseKey,
  PeopleKey,
  RelationshipKey,
} from "./types";

export const RELATIONSHIP_LABEL: Record<RelationshipKey, string> = {
  "close-friend": "친한 친구",
  "friend-group": "친구 모임",
  coworker: "직장 동료",
  "school-senior": "학교 선후배",
  "workplace-senior": "직장 선배·상사",
  family: "가족·친척",
  other: "기타",
};

export const PEOPLE_LABEL: Record<PeopleKey, string> = {
  "2": "2명",
  "3-4": "3~4명",
  "5-6": "5~6명",
  "7-8": "7~8명",
  "9+": "9명 이상",
};

export const AREA_LABEL: Record<AreaKey, string> = {
  gangnam: "강남역",
  sinnonhyeon: "신논현역",
  nonhyeon: "논현역",
  all: "강남권 전체",
};

/** PRD 8.4: 반열림 구간(하한 포함, 상한 미포함)으로 겹치지 않게 정의 */
export const BUDGET_LABEL: Record<BudgetKey, string> = {
  "under-20k": "2만 원 이하",
  "20-30k": "2만~3만 원",
  "30-50k": "3만~5만 원",
  "over-50k": "5만 원 이상",
  any: "예산은 상관없어요",
};

/** 네이버지도·카카오맵·배달앱이 공통으로 쓰는 업종 대분류 기준으로 라벨을 정리했다 */
export const CUISINE_LABEL: Record<CuisineKey, string> = {
  korean: "한식",
  western: "양식",
  japanese: "일식",
  chinese: "중식",
  meat: "고기·구이",
  seafood: "해산물",
  "wine-alcohol": "와인·주류 메뉴",
  "brunch-cafe": "브런치·카페",
  any: "상관 없음",
};

export const NOISE_LABEL: Record<NoiseKey, string> = {
  quiet: "대화가 잘 들리는 조용한 곳",
  "lively-but-talkable": "활기 있지만 대화는 가능한 곳",
  "lively-important": "분위기와 활기가 더 중요해요",
  any: "소음은 크게 중요하지 않아요",
};

export const MOOD_FORMALITY_LABEL: Record<MoodFormalityKey, string> = {
  casual: "편안하고 캐주얼한 자리",
  balanced: "너무 가볍지도 무겁지도 않은 자리",
  hospitable: "적당히 대접하는 느낌",
  formal: "격식 있고 차분한 자리",
  any: "분위기는 크게 중요하지 않아요",
};

/** PRD 8.6 기타 조건: 에어비앤비 스타일 다중선택 칩, 선택된 항목은 모두 제외 필터로 동작.
 *  예약·웨이팅은 원래 별도 질문(예약 필수/유연/줄서기 허용 등)이었으나 선택지가 복잡해
 *  "예약 가능한 곳" 한 칩으로 단순화해 여기로 합쳤다 */
export const EXTRA_CONDITION_LABEL: Record<ExtraConditionKey, string> = {
  "room-required": "룸이 꼭 필요해요",
  "parking-required": "주차가 꼭 필요해요",
  "wide-seating": "넉넉한 좌석 간격",
  "reservation-possible": "예약 가능한 식당",
};

export const RELATIONSHIP_OPTIONS = Object.keys(RELATIONSHIP_LABEL) as RelationshipKey[];
export const PEOPLE_OPTIONS = Object.keys(PEOPLE_LABEL) as PeopleKey[];
export const AREA_OPTIONS = Object.keys(AREA_LABEL) as AreaKey[];
export const BUDGET_OPTIONS = Object.keys(BUDGET_LABEL) as BudgetKey[];
export const CUISINE_OPTIONS = Object.keys(CUISINE_LABEL) as CuisineKey[];
export const NOISE_OPTIONS = Object.keys(NOISE_LABEL) as NoiseKey[];
export const MOOD_FORMALITY_OPTIONS = Object.keys(MOOD_FORMALITY_LABEL) as MoodFormalityKey[];
export const EXTRA_CONDITION_OPTIONS = Object.keys(
  EXTRA_CONDITION_LABEL,
) as ExtraConditionKey[];

/** "35천원" 같은 표현은 실제로 아무도 안 쓴다. 만/천원 단위로 나눠 자연스럽게 읽히게 만든다
 *  (예: 45000 → "4만 5천원", 60000 → "6만원") */
export function formatWon(n: number): string {
  // 천원 단위로 먼저 반올림해야 나머지가 항상 0~9000의 정확한 배수가 된다.
  // 순서를 바꿔 나눈 뒤에 반올림하면 19700원처럼 만원 경계에 걸린 값이 "1만 10천원"으로
  // 잘못 나올 수 있다.
  const rounded = Math.round(n / 1000) * 1000;
  const man = Math.floor(rounded / 10000);
  const cheon = (rounded % 10000) / 1000;
  if (man === 0) return `${cheon}천원`;
  if (cheon === 0) return `${man}만원`;
  return `${man}만 ${cheon}천원`;
}

export function formatPrice(min: number, max: number): string {
  return `${formatWon(min)}~${formatWon(max)}`;
}
