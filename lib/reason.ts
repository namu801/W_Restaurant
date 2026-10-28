import { AREA_LABEL, PEOPLE_LABEL, RELATIONSHIP_LABEL, VIBE_MOOD, formatPrice } from "./labels";
import type {
  Condition,
  ExtraConditionKey,
  MatchResult,
  MoodFormalityKey,
  NoiseLevel,
  Place,
  ReservationMethod,
  ScoreCategory,
} from "./types";
import type { ReasonIconKey } from "./icon-keys";

export interface ReasonCard {
  headline: string;
  description: string;
  /** 번호 배지 대신 조건입력 위저드와 같은 아이콘을 쓴다. 실제 컴포넌트가 아니라 키만
   *  담는 이유는 components/checkpoint-icon-map.tsx 참고 (서버→클라이언트 함수
   *  직렬화 문제 — 서버 컴포넌트인 장소 상세 페이지에서 컴포넌트를 그대로 못 넘긴다) */
  icon: ReasonIconKey;
  /** "이 식당만의 매력이에요" 같은 정형화된 제목은 모든 식당에서 똑같이 반복돼서, 정작
   *  식당마다 다른 실제 매력(curatedReason)이 작고 옅은 보조 텍스트로 묻혔다. 이 카드는
   *  제목 없이 description을 큰 텍스트로 보여준다 — description 자체가 이미 이 식당만의
   *  구체적인 매력이라 별도 제목이 필요 없다 */
  emphasizeDescription?: boolean;
}

/** 받침 유무에 따라 을/를, 와/과가 갈린다 — 한글 음절(가~힣)의 코드포인트에서
 *  종성(받침) 인덱스가 0이면 받침이 없는 글자다 */
function hasFinalConsonant(text: string): boolean {
  const last = text.trim().at(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function withObjectParticle(text: string): string {
  return `${text}${hasFinalConsonant(text) ? "을" : "를"}`;
}

function withConjunctionParticle(text: string): string {
  return `${text}${hasFinalConsonant(text) ? "과" : "와"}`;
}

function withSubjectParticle(text: string): string {
  return `${text}${hasFinalConsonant(text) ? "이" : "가"}`;
}

/** 카테고리별 "왜 추천하나" 카드 한 장. 헤드라인은 짧게 단정, 설명은 조건을 그대로 반영해
 *  왜 이 장소가 이 조건에 맞는지 구체적으로 이어붙인다 */
function reasonCard(key: ScoreCategory, condition: Condition): ReasonCard {
  switch (key) {
    case "relationship":
      return {
        headline: "관계에 잘 맞는 분위기예요",
        description: `${RELATIONSHIP_LABEL[condition.relationship]} 자리에 어울리는 공간이에요.`,
        icon: "users",
      };
    case "people":
      return {
        headline: "인원수에 넉넉한 좌석이에요",
        description: `${PEOPLE_LABEL[condition.people]} 모임에 알맞은 좌석 규모예요.`,
        icon: "users",
      };
    case "budget":
      return {
        headline: "예산 안에서 즐길 수 있어요",
        description: "부담스럽지 않은 가격대예요.",
        icon: "wallet",
      };
    case "access":
      return {
        headline: "역에서 가까워 모이기 편해요",
        description: "약속 장소로 접근성이 좋아요.",
        icon: "map-pinned",
      };
    case "food":
      return {
        headline: "찾으시던 음식과 잘 맞아요",
        description: "선호하는 음식 종류와 어울려요.",
        icon: "utensils-crossed",
      };
    case "conversation":
      return {
        headline: "대화하기 좋은 분위기예요",
        description: "차분히 이야기 나누기 좋은 공간이에요.",
        icon: "message-circle",
      };
    case "mood":
      return {
        headline: "원하는 분위기와 잘 맞아요",
        description: "바라시는 격식·대접감에 맞는 곳이에요.",
        icon: "heart-handshake",
      };
    case "seat":
      return {
        headline: "여유 있는 좌석이 있어요",
        description: "공간이 넉넉해 편하게 앉을 수 있어요.",
        icon: "armchair",
      };
    case "reservation":
      return {
        headline: "예약·웨이팅 부담이 적어요",
        description: "미리 준비하기 수월한 곳이에요.",
        icon: "calendar-check",
      };
    case "parking":
      return {
        headline: "이동이 편리해요",
        description: "주차 걱정을 덜 수 있어요.",
        icon: "square-parking",
      };
  }
}

function topStrengths(match: MatchResult, n = 2): ScoreCategory[] {
  const keys = Object.keys(match.ratios) as ScoreCategory[];
  return keys.sort((a, b) => match.ratios[b] - match.ratios[a]).slice(0, n);
}

const NOISE_TAG: Record<NoiseLevel, string> = {
  quiet: "조용해서 대화하기 좋음",
  moderate: "적당한 소음",
  lively: "활기찬 분위기",
};

const MOOD_TAG: Record<Exclude<MoodFormalityKey, "any">, string> = {
  casual: "캐주얼한 분위기",
  balanced: "무난한 분위기",
  hospitable: "정성스러운 서비스",
  formal: "격식 있는 분위기",
};

const RESERVATION_TAG: Record<ReservationMethod, string> = {
  available: "예약 가능",
  phone: "전화 예약 필요",
  difficult: "예약 권장",
  unavailable: "예약 불가",
};

/** 결과 카드(8.8)의 "핵심 강점 태그"용 라벨. "관계 적합"/"인원 적합"처럼 카테고리 이름만
 *  반복하던 걸, 이 장소의 실제 데이터(위치·좌석 규모·룸·예약 방식 등)로 구체화했다 —
 *  다만 실제로 확보하지 못한 정보(예: 역까지 도보 분 수)는 지어내지 않고, place.ts에
 *  이미 있는 값(area, capacityMax, noiseLevel, reservationMethod 등)만 근거로 쓴다 */
function cardTagLabel(key: ScoreCategory, place: Place, condition: Condition): string {
  switch (key) {
    case "relationship":
      return `${RELATIONSHIP_LABEL[condition.relationship]} 자리 적합`;
    case "people":
      return `${PEOPLE_LABEL[condition.people]} 모임 적합`;
    case "budget":
      return "예산 안에서 가능";
    case "access":
      return `${AREA_LABEL[place.area]} 인접`;
    case "food":
      return place.category;
    case "conversation":
      return NOISE_TAG[place.noiseLevel];
    case "mood":
      if (condition.vibe === "trendy" && place.trendScore >= 8) return "감성 있는 공간";
      return place.formalityTags[0] ? MOOD_TAG[place.formalityTags[0]] : "분위기 좋음";
    case "seat":
      return `최대 ${place.capacityMax}인 좌석`;
    case "reservation":
      return RESERVATION_TAG[place.reservationMethod];
    case "parking":
      return "주차 가능";
  }
}

/** 결과 카드(8.8)용: 알고리즘이 판단한 핵심 강점 태그. 적합도 비율 상위 카테고리를
 *  우선하되, "프라이빗 룸 보유"는 별도 ScoreCategory가 없어 늘 후보로만 있다가 밀려났다
 *  — 룸이 실제로 있으면(place.privateRoomAvailable) 순위와 무관하게 후보 맨 앞에 넣는다 */
export function topStrengthTags(match: MatchResult, condition: Condition, n = 3): string[] {
  const keys = Object.keys(match.ratios) as ScoreCategory[];
  const strong = keys.filter((k) => match.ratios[k] >= 0.75).sort((a, b) => match.ratios[b] - match.ratios[a]);
  const categoryTags = (strong.length > 0 ? strong : topStrengths(match, 2)).map((k) =>
    cardTagLabel(k, match.place, condition),
  );
  const tags = match.place.privateRoomAvailable ? ["프라이빗 룸 있음", ...categoryTags] : categoryTags;
  return Array.from(new Set(tags)).slice(0, n);
}

/** 장소 상세용 "왜 추천하나요" 카드 3장. 조건에서 가장 잘 맞는 2개 기준 + 이 식당만의
 *  실제 큐레이션 문구(curatedReason)를 마지막 카드로 붙여서, 조건이 같아도 식당마다
 *  다른 3번째 카드가 나오게 한다 */
export function generateDetailReason(condition: Condition, match: MatchResult): ReasonCard[] {
  const [s1, s2] = topStrengths(match);
  return [
    reasonCard(s1, condition),
    reasonCard(s2, condition),
    { headline: "", description: match.place.curatedReason, icon: "sparkles", emphasizeDescription: true },
  ];
}

/** 조건 컨텍스트 없이(예: 북마크함) 장소를 볼 때 쓰는 기본 추천 이유 */
export function genericReason(curatedReason: string): ReasonCard[] {
  return [{ headline: "", description: curatedReason, icon: "sparkles", emphasizeDescription: true }];
}

/** 결과 목록 상단 큐레이션 배지용. "N곳 중 M곳을 골라드렸어요"는 필터링 결과 요약일 뿐,
 *  큐레이터가 이 조건을 이해하고 무엇을 먼저 봤는지는 안 드러났다 — [누구와 만나는지] +
 *  [우선한 조건] 구조로 바꿔서, 같은 개수라도 조건이 다르면 다른 문장이 나오게 한다 */
const AUDIENCE_NOUN: Record<Condition["relationship"], string> = {
  "close-friend": "가까운 친구",
  "friend-group": "친구들",
  coworker: "직장 동료",
  "school-senior": "학교 선후배",
  "workplace-senior": "직장 선배·상사",
  family: "가족·친척",
  other: "이 모임",
};

const EXTRA_SIGNAL: Record<ExtraConditionKey, string> = {
  "room-required": "룸이 있는 자리",
  "parking-required": "주차",
  "wide-seating": "좌석 간격",
  "reservation-possible": "예약 가능 여부",
  "with-drinks": "술 한잔 곁들일 자리",
  "corkage-free": "콜키지",
};


/** 실제로 "우선한 조건"이라고 부를 만한 신호를 우선순위대로 모은다 — 사용자가 명시적으로
 *  "꼭 필요하다"고 고른 기타 조건이 가장 강한 신호이고, 그다음 소음·분위기, 마지막으로
 *  예산이 빠듯한 경우만 넣는다("상관없음"은 신호가 아니라서 뺀다) */
function prioritySignals(condition: Condition): string[] {
  const signals: string[] = [];
  // 필수 조건(룸·주차 등) → 분위기 카드 → 술 순서. 술은 가점일 뿐이라, 사용자가 직접 고른
  // 분위기보다 앞에 나오면 "무엇을 먼저 봤는지"가 어긋나 보인다
  for (const extra of condition.extraConditions) {
    // 콜키지는 확인된 매장이 적어 "먼저 본 조건"으로 내세우지 않는다
    if (extra !== "with-drinks" && extra !== "corkage-free") signals.push(EXTRA_SIGNAL[extra]);
  }
  // 분위기는 사진 카드 한 장으로 고른다 — 사용자가 실제로 고른 그 말(카드 이름)로 받아준다
  if (condition.vibe !== "any") signals.push(VIBE_MOOD[condition.vibe]);
  if (condition.extraConditions.includes("with-drinks")) signals.push(EXTRA_SIGNAL["with-drinks"]);
  if (condition.budget === "under-20k" || condition.budget === "20-30k") signals.push("1인 예산");
  return signals;
}

export function buildCurationSummary(condition: Condition): string {
  const audience = AUDIENCE_NOUN[condition.relationship];
  const signals = prioritySignals(condition).slice(0, 2);

  if (signals.length === 0) {
    return `${withConjunctionParticle(audience)} 잘 어울리는 곳을 먼저 살펴봤어요.`;
  }
  const joinedSignal =
    signals.length === 2 ? `${withConjunctionParticle(signals[0])} ${signals[1]}` : signals[0];
  return `${withConjunctionParticle(audience)}의 자리인 만큼, ${withObjectParticle(joinedSignal)} 먼저 살펴봤어요.`;
}

/** 결과 상단 추천 카드의 제목. 앞부분(누구와 몇 명)은 강조색으로, 뒷부분은 무엇을 먼저
 *  챙겨 골랐는지를 말한다. 예: [선배·상사 3~4명] 모임이라 차분하고 격식 있는 분위기를 먼저 챙겼어요 */
export function buildAgentHeadline(condition: Condition): { subject: string; rest: string } {
  const people = PEOPLE_LABEL[condition.people];
  const subject =
    condition.relationship === "other" ? `${people} 모임` : `${AUDIENCE_NOUN[condition.relationship]} ${people}`;
  const signals = prioritySignals(condition).slice(0, 2);
  const tail = condition.relationship === "other" ? "이라" : " 모임이라";
  if (signals.length === 0) return { subject, rest: `${tail} 다 같이 편하게 어울릴 곳을 골랐어요` };
  const joined = signals.length === 2 ? `${withConjunctionParticle(signals[0])} ${signals[1]}` : signals[0];
  return { subject, rest: `${tail} ${withObjectParticle(joined)} 먼저 챙겼어요` };
}

/* ───────────────────────── 상황 언어 ─────────────────────────
 * 예전 카드 문구는 점수가 가장 높은 카테고리에 고정 문장을 붙이는 방식이라("원하시는 분위기와
 * 잘 맞아요", "찾으시던 음식과 잘 맞아요") 어느 식당에 붙여도 똑같았고, 사용자가 고른 조건을
 * 되읽어줄 뿐 "왜 나를 위한 곳인지"가 안 느껴졌다.
 * 이제는 [관계 × 원하는 분위기]로 이 모임이 어떤 "자리"인지(윗분 모시는 자리, 친구와 편한
 * 자리…) 먼저 정하고, 그 자리에서 중요한 순서대로 이 식당의 실제 데이터(룸·좌석·소음·응대·
 * 예약·수용 인원·가격·주차·역 접근성)에서 근거를 골라 문장으로 번역한다. 데이터에 없는
 * 내용은 지어내지 않는다 — 근거가 되는 필드가 조건을 만족할 때만 그 문장이 나온다. */

type Scene = "host" | "coworker" | "friend" | "group" | "family" | "neutral";

function sceneOf(condition: Condition): Scene {
  const wantsCare = condition.moodFormality === "formal" || condition.moodFormality === "hospitable";
  switch (condition.relationship) {
    case "workplace-senior":
      return "host";
    case "school-senior":
      // 선후배는 위아래가 모두 가능해서, 격식·정성을 원했을 때만 "모시는 자리"로 본다
      return wantsCare ? "host" : "coworker";
    case "family":
      return "family";
    case "coworker":
      return "coworker";
    case "close-friend":
      return "friend";
    case "friend-group":
      return "group";
    case "other":
      return wantsCare ? "host" : "neutral";
  }
}

/** 문장 첫머리: 누구와 몇 명이 어떤 자리인지 */
function sceneOpener(scene: Scene, condition: Condition): string {
  const people = PEOPLE_LABEL[condition.people];
  const audience = AUDIENCE_NOUN[condition.relationship];
  switch (scene) {
    case "host":
      return condition.relationship === "other"
        ? `${withObjectParticle(people)} 모시는 자리로`
        : `${audience} ${withObjectParticle(people)} 모시는 자리로`;
    case "family":
      return `${audience} ${withConjunctionParticle(people)} 함께하는 자리로`;
    case "coworker":
      return `${audience} ${withConjunctionParticle(people)} 모이는 자리로`;
    case "friend":
      return `${audience} ${withConjunctionParticle(people)} 편하게 만나는 자리로`;
    case "group":
      return `${audience} ${withSubjectParticle(people)} 다 같이 모이는 자리로`;
    case "neutral":
      return `${people} 모임으로`;
  }
}

/** 1순위 카드 띠(헤드라인). "~라면 좋은 선택이에요" 같은 가정형은 이미 그렇게 답한 사용자에게
 *  일반 조언처럼 읽혀서, 이 모임이 어떤 자리인지 짚어 단정하는 문장으로 바꿨다 */
const SCENE_HEADLINE: Record<Scene, string> = {
  host: "윗분 모시는 자리로 가장 잘 맞는 곳이에요",
  coworker: "동료들과 부담 없이 모이기 가장 좋은 곳이에요",
  friend: "친구와 편하게 만나기 가장 좋은 곳이에요",
  group: "여럿이 다 같이 모이기 가장 좋은 곳이에요",
  family: "가족 모임으로 가장 잘 맞는 곳이에요",
  neutral: "이번 모임에 가장 잘 맞는 곳이에요",
};

type EvidenceKey =
  | "room"
  | "semiPrivate"
  | "quiet"
  | "lively"
  | "formal"
  | "trendy"
  | "hospitality"
  | "wide"
  | "capacity"
  | "reservation"
  | "budget"
  | "parking"
  | "access";

/** 근거 한 개를 두 가지 꼴로 들고 다닌다 — 앞 절에 쓰는 연결형("-고")과 마지막 절의
 *  종결형("-요"). 불규칙 활용 때문에 기계적으로 바꾸면 틀린 문장이 나와서 손으로 짝을 맞춘다 */
interface Evidence {
  and: string;
  end: string;
}

function evidenceFor(key: EvidenceKey, scene: Scene, condition: Condition, place: Place): Evidence | null {
  const formal = scene === "host" || scene === "family";
  const price = formatPrice(place.priceMin, place.priceMax);
  switch (key) {
    case "room":
      if (!place.privateRoomAvailable && place.seatType !== "room") return null;
      return formal
        ? { and: "룸이 있어 다른 테이블 신경 쓰지 않고 청첩장을 건넬 수 있고", end: "룸이 있어 다른 테이블 신경 쓰지 않고 청첩장을 건넬 수 있어요" }
        : { and: "룸이 있어 우리끼리 편하게 이야기할 수 있고", end: "룸이 있어 우리끼리 편하게 이야기할 수 있어요" };
    case "semiPrivate":
      if (place.seatType !== "semi-private") return null;
      return { and: "칸막이 좌석이라 옆 테이블과 분리돼 있고", end: "칸막이 좌석이라 옆 테이블과 분리돼 있어요" };
    case "quiet":
      if (place.noiseLevel !== "quiet") return null;
      return { and: "조용한 편이라 목소리 높이지 않고 대화할 수 있고", end: "조용한 편이라 목소리 높이지 않고 대화할 수 있어요" };
    case "lively":
      // 조용함을 원했거나 윗분·가족 자리라면 "활기"는 강점이 아니다
      if (place.noiseLevel !== "lively" || formal || condition.noise === "quiet") return null;
      return { and: "활기찬 분위기라 수다 떨기 좋고", end: "활기찬 분위기라 수다 떨기 좋아요" };
    case "formal":
      if (!place.formalityTags.includes("formal")) return null;
      return { and: "차분하고 격식 있는 분위기라 윗분 모시기 좋고", end: "차분하고 격식 있는 분위기라 윗분 모시기 좋아요" };
    case "trendy":
      if (place.trendScore < 8) return null;
      return { and: "요즘 감성의 공간이라 사진 남기기 좋고", end: "요즘 감성의 공간이라 사진 남기기 좋아요" };
    case "hospitality":
      if (place.hospitalityScore < 8) return null;
      if (scene === "family")
        return { and: "응대가 정성스러워 어른들 모시기 좋고", end: "응대가 정성스러워 어른들 모시기 좋아요" };
      if (scene === "host")
        return { and: "응대가 정성스러워 대접하기에 손색없고", end: "응대가 정성스러워 대접하기에 손색없어요" };
      return { and: "응대가 세심하고", end: "응대가 세심해요" };
    case "wide": {
      if (place.seatType !== "wide" && place.spaceScore < 7) return null;
      const many = condition.people === "5-6" || condition.people === "7-8" || condition.people === "9+";
      return many
        ? { and: "테이블 간격이 넉넉해 여럿이 앉아도 답답하지 않고", end: "테이블 간격이 넉넉해 여럿이 앉아도 답답하지 않아요" }
        : { and: "테이블 간격이 넉넉해 답답하지 않고", end: "테이블 간격이 넉넉해 답답하지 않아요" };
    }
    case "capacity": {
      const needsRoom = condition.people === "5-6" || condition.people === "7-8" || condition.people === "9+";
      if (!needsRoom || place.capacityMax < 8) return null;
      const people = PEOPLE_LABEL[condition.people];
      return {
        and: `최대 ${place.capacityMax}명까지 앉을 수 있어 ${people} 모임도 넉넉하고`,
        end: `최대 ${place.capacityMax}명까지 앉을 수 있어 ${people} 모임도 넉넉해요`,
      };
    }
    case "reservation":
      if (place.reservationMethod !== "available" || place.waitingRisk > 5) return null;
      return formal
        ? { and: "예약이 돼서 당일 기다리시게 할 걱정이 없고", end: "예약이 돼서 당일 기다리시게 할 걱정이 없어요" }
        : { and: "예약이 돼서 당일 기다릴 걱정이 없고", end: "예약이 돼서 당일 기다릴 걱정이 없어요" };
    case "budget":
      if (condition.budget === "any" || place.priceMax > BUDGET_UPPER[condition.budget]) return null;
      return scene === "host"
        ? { and: `1인 ${price}이라 대접하기에도 부담이 적고`, end: `1인 ${price}이라 대접하기에도 부담이 적어요` }
        : { and: `1인 ${price}으로 예산 안에서 즐길 수 있고`, end: `1인 ${price}으로 예산 안에서 즐길 수 있어요` };
    case "parking":
      if (!place.parkingAvailable) return null;
      return scene === "family"
        ? { and: "주차가 돼서 차로 오시는 어른들도 편하고", end: "주차가 돼서 차로 오시는 어른들도 편해요" }
        : { and: "주차가 돼서 차로 와도 편하고", end: "주차가 돼서 차로 와도 편해요" };
    case "access":
      if (place.accessScore < 8) return null;
      return {
        and: `${AREA_LABEL[place.area]}에서 가까워 모이기 편하고`,
        end: `${AREA_LABEL[place.area]}에서 가까워 모이기 편해요`,
      };
  }
}

/** 자리마다 "먼저 챙겨야 할 것"의 순서 */
const SCENE_PRIORITY: Record<Scene, EvidenceKey[]> = {
  host: ["room", "quiet", "formal", "hospitality", "semiPrivate", "reservation", "budget", "access", "parking"],
  family: ["room", "parking", "hospitality", "quiet", "wide", "semiPrivate", "reservation", "budget", "access"],
  coworker: ["access", "reservation", "quiet", "semiPrivate", "budget", "room", "wide", "hospitality"],
  friend: ["budget", "quiet", "lively", "semiPrivate", "room", "access", "hospitality", "reservation"],
  group: ["capacity", "wide", "lively", "reservation", "room", "budget", "access"],
  neutral: ["budget", "access", "reservation", "quiet", "room", "wide", "hospitality"],
};

/** 사용자가 직접 고른 조건에 해당하는 근거는 자리별 순서보다 앞에 둔다 */
function explicitEvidence(condition: Condition): EvidenceKey[] {
  const keys: EvidenceKey[] = [];
  const fromExtra: Partial<Record<ExtraConditionKey, EvidenceKey>> = {
    "room-required": "room",
    "parking-required": "parking",
    "wide-seating": "wide",
    "reservation-possible": "reservation",
  };
  for (const extra of condition.extraConditions) {
    const key = fromExtra[extra];
    if (key) keys.push(key);
  }
  if (condition.noise === "quiet") keys.push("quiet", "room", "semiPrivate");
  if (condition.noise === "lively-important") keys.push("lively");
  if (condition.vibe === "trendy") keys.push("trendy");
  if (condition.moodFormality === "formal") keys.push("formal");
  if (condition.moodFormality === "hospitable") keys.push("hospitality");
  return keys;
}

function pickEvidence(scene: Scene, condition: Condition, place: Place, n = 2): Evidence[] {
  const order = [...explicitEvidence(condition), ...SCENE_PRIORITY[scene]];
  const seen = new Set<EvidenceKey>();
  const picked: Evidence[] = [];
  for (const key of order) {
    if (seen.has(key)) continue;
    seen.add(key);
    const ev = evidenceFor(key, scene, condition, place);
    if (ev) picked.push(ev);
    if (picked.length === n) break;
  }
  return picked;
}

/** 이 자리에서 꼭 알아야 할 아쉬운 점 하나. 사용자가 직접 고른 조건과 어긋나는 것부터 본다 */
function situationCaveat(scene: Scene, condition: Condition, place: Place): string | null {
  const formal = scene === "host" || scene === "family";
  const bigGroup = condition.people === "5-6" || condition.people === "7-8" || condition.people === "9+";
  const hasRoom = place.privateRoomAvailable || place.seatType === "room";
  if ((condition.noise === "quiet" || formal) && place.noiseLevel === "lively" && !hasRoom)
    return "다만 홀이 활기찬 편이라 조용히 대화하긴 어려울 수 있어요";
  // '깔끔하고 편안한' 카드는 "북적여도 대화는 편한 곳"이라고 약속한다. 그 약속과 어긋나는 활기찬 홀이면 알린다.
  // 트렌디는 소음 조건이 같지만 카드가 소음을 약속하지 않아서(사진 남기기 좋은 곳) 여기서 빼둔다
  if (condition.vibe === "neat-comfy" && place.noiseLevel === "lively" && !hasRoom)
    return "다만 홀이 활기찬 편이라 대화 소리가 커질 수 있어요";
  if (condition.extraConditions.includes("parking-required") && !place.parkingAvailable)
    return "다만 주차는 어려워요";
  if (place.reservationMethod === "unavailable" && (formal || bigGroup))
    return "다만 예약을 받지 않아 웨이팅이 생길 수 있어요";
  if (place.reservationMethod === "difficult" && formal)
    return "다만 예약이 치열한 편이라 미리 잡아두는 게 좋아요";
  // 상한이 예산을 조금 넘는 건 흔해서 매번 말하면 소음이 된다. 가장 싼 메뉴부터 예산을 넘을 때만 알린다
  if (condition.budget !== "any" && place.priceMin > BUDGET_UPPER[condition.budget])
    return "다만 가장 저렴한 메뉴도 예산을 넘어요";
  if (scene === "family" && !place.parkingAvailable) return "다만 주차는 어려워요";
  return null;
}

/** withOpener: "직장 선배·상사 3~4명을 모시는 자리로," 같은 첫머리를 붙일지. 모든 카드에
 *  붙이면 6장이 같은 말로 시작해 길고 비슷해 보여서, 1순위 카드에만 붙인다 */
function situationSentence(condition: Condition, place: Place, withOpener: boolean): string {
  const scene = sceneOf(condition);
  const evidence = pickEvidence(scene, condition, place);
  if (evidence.length === 0) return place.curatedReason;
  const body = evidence.length === 2 ? `${evidence[0].and} ${evidence[1].end}` : evidence[0].end;
  return withOpener ? `${sceneOpener(scene, condition)}, ${body}.` : `${body}.`;
}

/** 카드(8.8)의 추천 문구: [어떤 자리인지(1순위만)] + [이 식당 데이터에서 고른 근거 1~2개]
 *  + [이 자리에서 아쉬운 점 0~1개] */
export function generateCardSentence(
  condition: Condition,
  match: MatchResult,
  { withOpener = false }: { withOpener?: boolean } = {},
): string {
  const { place } = match;
  const caveat = situationCaveat(sceneOf(condition), condition, place);
  const main = situationSentence(condition, place, withOpener);
  return caveat ? `${main} ${caveat}.` : main;
}

/** 행 근거로 더 볼 수 있는 키. 자리별 순서에 없는 근거도 위 행과 겹칠 땐 꺼내 쓴다 */
const ROW_EXTRA_KEYS: EvidenceKey[] = ["room", "semiPrivate", "quiet", "formal", "hospitality", "wide", "reservation", "access", "parking", "trendy", "capacity"];

/** 근거가 겹칠 때 앞에 짧게 남기는 핵심 사실 */
const ROW_SHORT: Partial<Record<EvidenceKey, string>> = {
  room: "룸이 있고",
  semiPrivate: "칸막이 좌석이고",
  quiet: "조용한 편이고",
  formal: "격식 있는 분위기이고",
  wide: "테이블 간격이 넉넉하고",
};

/** "양갈비예요" / "족발이에요" */
function withCopula(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
  return `${word}${hasFinal ? "이에요" : "예요"}`;
}

/** 근거 문장 맨 앞의 "식당 데이터" 부분. 목록에서 이 부분만 굵게 보여줘, 조건을 되읽는 말이 아니라
 *  이 식당의 데이터가 근거라는 걸 드러낸다 */
const REASON_LEAD = [
  /^룸이 있어/, /^룸이 있고/, /^칸막이 좌석이라/, /^칸막이 좌석이고/, /^조용한 편이라/, /^조용한 편이고/,
  /^활기찬 분위기라/, /^차분하고 격식 있는 분위기라/, /^격식 있는 분위기이고/, /^요즘 감성의 공간이라/,
  /^응대가 정성스러워/, /^응대가 세심해/, /^테이블 간격이 넉넉해/, /^테이블 간격이 넉넉하고/,
  /^최대 \d+명까지 앉을 수 있어/, /^예약이 돼서/, /^주차가 돼서/, /^\S+에서 가까워/,
];

export function splitReasonLead(reason: string): { lead: string; rest: string } {
  const m = REASON_LEAD.map((re) => reason.match(re)).find(Boolean);
  return m ? { lead: m[0], rest: reason.slice(m[0].length) } : { lead: "", rest: reason };
}

/** 압축 목록 한 줄용: 근거는 1개만, 아쉬운 점은 따로 돌려준다.
 *  - 가격은 행에 이미 숫자로 있어서 "1인 …원이라" 근거는 쓰지 않는다
 *  - 위 행들이 이미 쓴 근거(used)는 피한다. 같은 조건이면 여러 곳이 똑같이 "조용한 편이라…"로
 *    시작해 차이가 안 보였다. 쓸 근거가 다 겹치면 대표 메뉴로 이 집만의 정보를 준다 */
export function generateRowReason(
  condition: Condition,
  match: MatchResult,
  used: Set<string> = new Set(),
): { reason: string; caveat: string | null; key: string | null } {
  const { place } = match;
  const scene = sceneOf(condition);
  const order = [...explicitEvidence(condition), ...SCENE_PRIORITY[scene], ...ROW_EXTRA_KEYS];
  let pick: (Evidence & { key: EvidenceKey }) | null = null;
  for (const key of new Set(order)) {
    if (key === "budget" || used.has(key)) continue;
    const ev = evidenceFor(key, scene, condition, place);
    if (ev) {
      pick = { ...ev, key };
      break;
    }
  }
  const caveatRaw = situationCaveat(scene, condition, place);
  const caveat = caveatRaw ? `${caveatRaw.replace(/^다만 /, "")}.` : null;
  if (pick) return { reason: `${pick.end}.`, caveat, key: pick.key };
  // 근거가 모두 위 행과 겹쳐도 핵심 사실(룸 등)은 짧게 남기고, 뒤에 대표 메뉴를 붙여 차이를 준다
  const signature = place.menu[0]?.name.replace(/\(.*?\)|\[.*?\]/g, "").trim();
  const shortKey = order.find((k) => k in ROW_SHORT && evidenceFor(k, scene, condition, place));
  const lead = shortKey ? `${ROW_SHORT[shortKey]}, ` : "";
  return {
    reason: signature ? `${lead}대표 메뉴는 ${withCopula(signature)}.` : place.curatedReason,
    caveat,
    key: null,
  };
}

/** 상세 페이지 추천 이유 카드: 제목 한 줄 + 식당 데이터에서 고른 근거 최대 3개.
 *  예전 카드 3장(관계에 잘 맞는 분위기예요 / 인원수에 넉넉한 좌석이에요 / 긴 소개 문장)은
 *  체크포인트와 같은 말을 반복했다 — 목록 카드와 같은 근거 문장으로 맞추고, 근거가 모자랄 때만
 *  식당 소개(curatedReason)를 덧붙인다 */
export function generateDetailSummary(
  condition: Condition | null,
  match: MatchResult | null,
  place: Place,
): { title: string; bullets: string[] } {
  if (!condition || !match) return { title: "이 식당을 고른 이유", bullets: [place.curatedReason] };
  const { subject } = buildAgentHeadline(condition);
  const title = condition.relationship === "other" ? `${subject}에 추천하는 이유` : `${subject} 모임에 추천하는 이유`;
  const bullets = pickEvidence(sceneOf(condition), condition, place, 3).map((e) => `${e.end}.`);
  if (bullets.length < 2) bullets.push(place.curatedReason);
  return { title, bullets };
}

export interface Verdict {
  /** 이 모임이 어떤 자리인지 짚어 단정하는 결론 헤드라인 */
  headline: string;
  /** 어떤 자리인지 + 이 식당 데이터에서 고른 근거 1~2개 */
  lead: string;
  /** 이 자리에서 꼭 알아야 할 아쉬운 점이 있을 때만 채워진다 */
  caveat: string | null;
}

/** 결과 1순위 카드의 띠(헤드라인)와 리드 문장 */
export function generateVerdict(condition: Condition, match: MatchResult): Verdict {
  const scene = sceneOf(condition);
  const caveat = situationCaveat(scene, condition, match.place);
  return {
    headline: SCENE_HEADLINE[scene],
    lead: situationSentence(condition, match.place, true),
    caveat: caveat ? `${caveat}.` : null,
  };
}

const BUDGET_UPPER: Record<Exclude<Condition["budget"], "any">, number> = {
  "under-20k": 20_000,
  "20-30k": 30_000,
  "30-50k": 50_000,
  "over-50k": Infinity,
};

/** 예약 직전에 확인할 사실 몇 개. 전엔 "청모픽 예약 팁/주문 팁/모임 팁" 세 블록으로
 *  나눠서 같은 이야기(룸·예산·대기)가 여기저기 흩어져 길어 보였다 — 실제로 확인이
 *  필요한 사실만 최대 3개로 추려서 짧게 보여준다. 요일별 대기 통계처럼 실제로 확보
 *  못 한 데이터는 지어내지 않고, 있는 필드(reservationMethod/waitingRisk/priceMax/
 *  formalityTags 등)에서 합리적으로 끌어낼 수 있는 사실만 담는다.
 *  place.cautionNote(장소별로 직접 조사해 적어둔 실제 주의사항)를 최우선으로 넣고,
 *  남는 자리만 자동 생성한 사실로 채운다 */
export function generateBookingFacts(place: Place, condition: Condition | null): string[] {
  const facts: string[] = [place.cautionNote];

  if (place.privateRoomAvailable && place.roomMinCapacity) {
    facts.push(`룸은 ${place.roomMinCapacity}인 이상부터 가능해요.`);
  }
  if (place.reservationMethod === "phone" || place.reservationMethod === "difficult") {
    facts.push("전화로 미리 예약해두는 게 안전해요.");
  }
  if (condition && condition.budget !== "any" && place.priceMax > BUDGET_UPPER[condition.budget]) {
    facts.push("룸·코스 이용 시 1인 예산을 넘을 수 있어요.");
  }
  if (place.waitingRisk >= 6) facts.push("피크타임엔 대기가 있을 수 있어요.");
  if (place.formalityTags.includes("formal") || place.formalityTags.includes("hospitable")) {
    facts.push("주말 점심이 저녁보다 비교적 편안하게 대화하기 좋아요.");
  }
  if (facts.length === 0) facts.push("예약 없이도 비교적 편하게 방문할 수 있는 곳이에요.");

  return facts.slice(0, 3);
}

/** 버튼 근처에 둘 한 줄. "예약할 때 이렇게 말해보세요"처럼 그대로 따라 할 수 있는
 *  실행 문구라 조언보다 더 직접적으로 도움이 된다 */
export function generateReservationAsk(condition: Condition | null): string {
  const peoplePart = condition ? PEOPLE_LABEL[condition.people] : "일행";
  return `예약할 때 "${peoplePart}이 조용히 이야기할 자리"라고 요청해보세요.`;
}

export type AlternativeAxis = "mood" | "budget" | "room";

/** 결과 목록이 점수순으로 줄 세운 6장이 아니라, "사용자가 중요하게 보는 가치에 따라
 *  다른 선택지를 제안하는 큐레이션"으로 보이려면 1순위 옆에 다른 축의 대안을 나란히
 *  보여줘야 한다 — 각 대안이 왜 고려할 만한지와, 1순위 대비 무엇을 포기하게 되는지를
 *  같이 말해준다(좋은 점만 말하지 않는다) */
export function generateAlternativeMeta(
  axis: AlternativeAxis,
  match: MatchResult,
): { title: string; caveat: string } {
  switch (axis) {
    case "mood":
      return {
        title: "분위기를 더 챙긴 선택",
        caveat: "다만 1순위보다 메뉴 선택과 가격 부담이 있을 수 있어요.",
      };
    case "budget":
      return {
        title: "예산이 편한 선택",
        caveat: "대신 청첩장 모임만의 특별한 분위기는 조금 덜해요.",
      };
    case "room":
      return {
        title: "룸을 우선한 선택",
        caveat:
          match.place.capacityMin > 4
            ? "인원이 적으면 공간이 다소 크게 느껴질 수 있어요."
            : "다만 아늑하고 특별한 분위기까지는 아닐 수 있어요.",
      };
  }
}
