import type {
  AreaKey,
  BudgetKey,
  CuisineKey,
  ExtraConditionKey,
  MatchResult,
  MoodFormalityKey,
  NoiseKey,
  PeopleKey,
  RelationshipKey,
  SeatType,
} from "./types";

export const RELATIONSHIP_LABEL: Record<RelationshipKey, string> = {
  "close-friend": "가까운 친구",
  "friend-group": "친구·지인 모임",
  coworker: "직장 동료",
  "school-senior": "학교 선후배",
  "workplace-senior": "직장 선배·상사",
  family: "가족·친척",
  other: "그 밖의 관계",
};

export const PEOPLE_LABEL: Record<PeopleKey, string> = {
  "2": "2명",
  "3-4": "3~4명",
  "5-6": "5~6명",
  "7-8": "7~8명",
  "9+": "9명 이상",
};

export const AREA_LABEL: Record<AreaKey, string> = {
  all: "용산권 어디든",
  yongsan: "용산역",
  samgakji: "삼각지역",
  sinyongsan: "신용산역",
};

/** PRD 8.4: 반열림 구간(하한 포함, 상한 미포함)으로 겹치지 않게 정의 */
export const BUDGET_LABEL: Record<BudgetKey, string> = {
  "under-20k": "2만 원 이하",
  "20-30k": "2만~3만 원",
  "30-50k": "3만~5만 원",
  "over-50k": "5만 원 이상",
  any: "예산 상관없는 곳",
};

/** 네이버지도·카카오맵·배달앱이 공통으로 쓰는 업종 대분류 기준으로 라벨을 정리했다 */
export const CUISINE_LABEL: Record<CuisineKey, string> = {
  korean: "한식",
  western: "양식",
  japanese: "일식",
  chinese: "중식",
  meat: "고기·구이",
  seafood: "해산물",
  "wine-alcohol": "와인·주류",
  "brunch-cafe": "브런치·카페",
  any: "메뉴는 상관없어요",
};

export const NOISE_LABEL: Record<NoiseKey, string> = {
  quiet: "조용히 이야기하고 싶어요",
  "lively-but-talkable": "조금 활기 있어도 괜찮아요",
  "lively-important": "활기찬 분위기가 더 좋아요",
  any: "소음은 크게 상관없어요",
};

export const MOOD_FORMALITY_LABEL: Record<MoodFormalityKey, string> = {
  casual: "편하고 캐주얼하게",
  balanced: "깔끔하고 무난하게",
  hospitable: "조금 더 정성스럽게",
  formal: "차분하고 격식 있게",
  any: "분위기는 크게 상관없어요",
};

/** lib/checkpoints.ts의 문장형 설명과 달리, 지도 카드 등 좁은 칩 자리에 쓰는 짧은 형태 */
export const SEAT_TYPE_LABEL: Record<SeatType, string> = {
  room: "룸 좌석",
  "semi-private": "반분리 좌석",
  wide: "넓은 좌석",
  open: "오픈 좌석",
};

/** PRD 8.6 기타 조건: 에어비앤비 스타일 다중선택 칩, 선택된 항목은 모두 제외 필터로 동작.
 *  예약·웨이팅은 원래 별도 질문(예약 필수/유연/줄서기 허용 등)이었으나 선택지가 복잡해
 *  "예약 가능한 곳" 한 칩으로 단순화해 여기로 합쳤다 */
export const EXTRA_CONDITION_LABEL: Record<ExtraConditionKey, string> = {
  "room-required": "룸이 있는 식당",
  "parking-required": "주차 가능한 식당",
  "wide-seating": "좌석 간격이 넉넉한 식당",
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

/** 식당 후보 카드처럼 한 줄로 훑어보는 자리에서는 브레이크타임·라스트오더까지 다 보여주면
 *  너무 길어진다. 상세 페이지엔 원문 그대로 두고, 카드에서만 이 함수로 줄여 쓴다.
 *  괄호 안에 브레이크타임/라스트오더가 낀 구간과, 괄호 밖에 단독으로 붙는 절 둘 다 지운다 —
 *  "(연중무휴)"처럼 그 두 단어가 없는 괄호는 그대로 남긴다. lib/places.ts의 20개 실제
 *  영업시간 문자열로 전부 검증했다 */
export function simplifyBusinessHours(hours: string): string {
  return hours
    .replace(/\([^)]*(?:브레이크타임|라스트오더)[^)]*\)/g, "")
    .replace(/\s*(?:브레이크타임|라스트오더)\s*[0-9:~-]+(?:\s*[0-9:~-]+)?/g, "")
    .replace(/\s+,/g, ",")
    .replace(/,\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const DAY_SEQUENCE = ["월", "화", "수", "목", "금", "토", "일"] as const;
// DAY_SEQUENCE의 각 글자가 실제로 어떤 요일(JS Date.getDay() 기준, 0=일요일)인지 매핑한다.
// "월화수목금토일" 순서는 한국식 요일 표기 순서라 일요일이 맨 끝인데, getDay()는 일요일이 0이라
// 두 순서가 다르다 — 이 배열이 둘을 이어준다.
const DAY_SEQUENCE_WEEKDAY = [1, 2, 3, 4, 5, 6, 0];

/** 서버(Vercel, 보통 UTC)와 클라이언트(한국 사용자 브라우저)의 로컬 타임존이 서로 달라서
 *  new Date().getDay()를 그냥 쓰면 자정 근처에 서버·클라이언트가 "오늘"을 다르게 계산해
 *  하이드레이션이 어긋날 수 있다. 항상 KST(UTC+9) 기준으로 직접 계산해서 실행 환경의
 *  타임존과 무관하게 항상 같은 값이 나오게 한다 */
function getKstWeekday(): number {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).getUTCDay();
}

function dayTokenToWeekdays(token: string): Set<number> {
  if (token === "매일") return new Set([0, 1, 2, 3, 4, 5, 6]);
  const chars = token
    .replace("공휴일", "")
    .split(/[~\-·]/)
    .filter((c): c is (typeof DAY_SEQUENCE)[number] =>
      (DAY_SEQUENCE as readonly string[]).includes(c),
    );
  if (chars.length === 0) return new Set();
  const startIdx = DAY_SEQUENCE.indexOf(chars[0]);
  const endIdx = DAY_SEQUENCE.indexOf(chars[chars.length - 1]);
  if (startIdx < 0 || endIdx < 0 || startIdx > endIdx) return new Set();
  return new Set(DAY_SEQUENCE_WEEKDAY.slice(startIdx, endIdx + 1));
}

const CLOSED_DAY_PATTERN = /(?:매주\s*)?([월화수목금토일])요일\s*휴무/;
const DAY_TIME_PATTERN =
  /(매일|[월화수목금토일](?:[~\-·][월화수목금토일])*(?:[~\-·]?공휴일)?)\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g;

/** 카드에서 "월~금 16:30-24:00 토·일·공휴일 16:00-24:00" 처럼 요일별 영업시간을 다 나열하면
 *  너무 길다 — "오늘"에 해당하는 구간 하나만 골라 보여준다. 매일 영업이면 요일 라벨 없이
 *  시간만, 평일 전체(월~금)/주말 전체(토·일)면 "평일"/"주말"로, 그 외 애매한 구간(화-금 등)은
 *  "오늘"로 라벨을 붙인다. 상세 페이지는 원문 그대로 두고 이 함수는 카드 전용이다.
 *  lib/places.ts의 실제 영업시간 문자열 19개 × 요일 7개(133가지 조합)로 전부 검증했다 —
 *  구분자(~, -, ·)와 표기(화-일/화-금/월요일 휴무 등)가 제각각이라 하나씩 확인이 필요했다 */
export function todayBusinessHours(hours: string, today: number = getKstWeekday()): string {
  const closedMatch = hours.match(CLOSED_DAY_PATTERN);
  if (closedMatch) {
    const closedIdx = DAY_SEQUENCE.indexOf(closedMatch[1] as (typeof DAY_SEQUENCE)[number]);
    if (closedIdx >= 0 && DAY_SEQUENCE_WEEKDAY[closedIdx] === today) {
      return "오늘 휴무";
    }
  }

  for (const [, token, start, end] of hours.matchAll(DAY_TIME_PATTERN)) {
    const weekdays = dayTokenToWeekdays(token);
    if (!weekdays.has(today)) continue;
    if (token === "매일") return `${start}-${end}`;
    if (weekdays.size === 5 && [1, 2, 3, 4, 5].every((d) => weekdays.has(d))) {
      return `평일 ${start}-${end}`;
    }
    if (weekdays.size === 2 && weekdays.has(6) && weekdays.has(0)) return `주말 ${start}-${end}`;
    return `오늘 ${start}-${end}`;
  }

  // 예상 못 한 새 포맷이면 안전하게 기존 축약 로직으로 대체한다
  return simplifyBusinessHours(hours);
}

/** 카드(PlaceCard)와 상세 페이지 둘 다 같은 fitLabel을 같은 Tag 색으로 보여줘야 해서
 *  공유 lib로 뺐다 — 예전엔 각 파일에 따로 정의돼 있어 둘이 어긋날 여지가 있었다.
 *  components/ui/Tag의 TagVariant를 그대로 import하지 않고 값만 맞춰 적었다 — lib가
 *  component를 거꾸로 의존하지 않게 하기 위해서다 */
export const FIT_TAG_VARIANT: Record<
  MatchResult["fitLabel"],
  "neutral" | "accent" | "warning" | "positive"
> = {
  "매우 잘 맞아요": "positive",
  "잘 맞아요": "accent",
  "일부 조건을 확인해보세요": "neutral",
};

/** "매우 잘 맞아요"/"일부 조건을 확인해보세요" 같은 긴 문구는 칩 하나가 카드 폭을 꽤
 *  차지했다 — 장소마다 실제로 다른 fitRatio(0~1)를 그대로 "N점"으로 보여주면 훨씬
 *  짧으면서도 장소별 차이가 숫자로 바로 드러나 더 직관적이다. fitLabel/FIT_TAG_VARIANT는
 *  칩 색(긍정/보통/주의)을 정하는 용도로 그대로 두고, 칩 안의 텍스트만 이 값으로 바꾼다 */
export function formatFitScore(fitRatio: number): string {
  return `${Math.round(fitRatio * 100)}점`;
}
