import { AREA_LABEL, formatPrice, formatWon, PEOPLE_LABEL, RELATIONSHIP_LABEL } from "./labels";
import type {
  Condition,
  ExtraConditionKey,
  MatchResult,
  MoodFormalityKey,
  NoiseKey,
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
   *  담는 이유는 lib/checkpoints.ts 상단 주석 참고 (서버→클라이언트 함수 직렬화 문제) */
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

const CATEGORY_ICON: Record<ScoreCategory, ReasonIconKey> = {
  relationship: "users",
  people: "users",
  budget: "wallet",
  access: "map-pinned",
  food: "utensils-crossed",
  conversation: "message-circle",
  mood: "heart-handshake",
  seat: "armchair",
  reservation: "calendar-check",
  parking: "square-parking",
};

/** 카테고리별 "왜 추천하나" 카드 한 장. "관계에 잘 맞는 분위기예요"처럼 카테고리 이름을
 *  그대로 반복하던 헤드라인 대신, "대화하기 편해요"/"만나기 부담이 적어요"처럼 사람이
 *  실제로 판단을 내린 것 같은 짧은 문장으로 바꿨다 */
const STORY_CARD: Record<
  ScoreCategory,
  (condition: Condition, place: Place) => { headline: string; description: string }
> = {
  relationship: (condition) => ({
    headline: "잘 어울리는 자리예요",
    description: `${RELATIONSHIP_LABEL[condition.relationship]}와 함께하기 좋은 분위기예요.`,
  }),
  people: (condition) => ({
    headline: "인원에 맞는 좌석이에요",
    description: `${PEOPLE_LABEL[condition.people]}이 편하게 앉을 수 있는 규모예요.`,
  }),
  budget: (_condition, place) => ({
    headline: "예산 부담이 적어요",
    description: `1인 ${formatPrice(place.priceMin, place.priceMax)} 수준으로 크게 부담스럽지 않아요.`,
  }),
  access: (_condition, place) => ({
    headline: "만나기 부담이 적어요",
    description: `${AREA_LABEL[place.area]}과 가까워 모이기 편해요.`,
  }),
  food: (_condition, place) => ({
    headline: "찾던 음식과 잘 맞아요",
    description: `${place.category}라 취향에 맞게 즐길 수 있어요.`,
  }),
  conversation: () => ({
    headline: "대화하기 편해요",
    description: "공간이 차분하고 대화에 집중하기 좋아요.",
  }),
  mood: () => ({
    headline: "자리를 신경 썼다는 인상을 줘요",
    description: "너무 격식 있지는 않지만, 청첩장을 건네는 자리로는 충분히 정돈된 분위기예요.",
  }),
  seat: () => ({
    headline: "좌석이 여유로워요",
    description: "좌석 간격이 넉넉해 편하게 앉을 수 있어요.",
  }),
  reservation: () => ({
    headline: "예약 부담이 적어요",
    description: "미리 준비하기 수월한 곳이에요.",
  }),
  parking: () => ({
    headline: "이동이 편리해요",
    description: "주차 걱정 없이 올 수 있어요.",
  }),
};

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

/** 장소 상세 "이 모임에 잘 맞는 이유" 카드 3장. 예전엔 "관계에 잘 맞는 분위기예요"처럼
 *  항목별 매칭 결과를 나열해서 체크리스트처럼 보였다 — 조건에서 가장 잘 맞는 카테고리
 *  3개를 골라 각각 실제 판단처럼 읽히는 짧은 이유로 보여준다(STORY_CARD) */
export function generateDetailReason(condition: Condition, match: MatchResult): ReasonCard[] {
  return topStrengths(match, 3).map((key) => {
    const { headline, description } = STORY_CARD[key](condition, match.place);
    return { headline, description, icon: CATEGORY_ICON[key] };
  });
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
};

const NOISE_SIGNAL: Record<Exclude<NoiseKey, "any">, string> = {
  quiet: "조용함",
  "lively-but-talkable": "적당한 활기",
  "lively-important": "활기",
};

const MOOD_SIGNAL: Record<Exclude<MoodFormalityKey, "any">, string> = {
  casual: "편안한 분위기",
  balanced: "무난한 분위기",
  hospitable: "정성스러운 서비스",
  formal: "격식 있는 분위기",
};

/** 실제로 "우선한 조건"이라고 부를 만한 신호를 우선순위대로 모은다 — 사용자가 명시적으로
 *  "꼭 필요하다"고 고른 기타 조건이 가장 강한 신호이고, 그다음 소음·분위기, 마지막으로
 *  예산이 빠듯한 경우만 넣는다("상관없음"은 신호가 아니라서 뺀다) */
function prioritySignals(condition: Condition): string[] {
  const signals: string[] = [];
  for (const extra of condition.extraConditions) signals.push(EXTRA_SIGNAL[extra]);
  if (condition.noise !== "any") signals.push(NOISE_SIGNAL[condition.noise]);
  if (condition.moodFormality !== "any") signals.push(MOOD_SIGNAL[condition.moodFormality]);
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

const POSITIVE_FRAGMENT: Record<ScoreCategory, (condition: Condition, place: Place) => string> = {
  relationship: (condition) => `${RELATIONSHIP_LABEL[condition.relationship]} 자리에 잘 어울려요`,
  people: (condition) => `${PEOPLE_LABEL[condition.people]}이 편하게 앉을 수 있어요`,
  budget: () => "예산 안에서 부담 없이 즐길 수 있어요",
  access: (_condition, place) => `${AREA_LABEL[place.area]}에서 가까워 모이기 편해요`,
  food: () => "찾으시던 음식과 잘 맞아요",
  conversation: () => "차분히 이야기 나누기 좋아요",
  mood: () => "원하시는 분위기와 잘 맞아요",
  seat: () => "좌석 간격이 여유로워요",
  reservation: () => "예약·웨이팅 부담이 적어요",
  parking: () => "주차 걱정 없이 이동할 수 있어요",
};

const CAVEAT_FRAGMENT: Record<ScoreCategory, string> = {
  relationship: "이 관계엔 조금 아쉬울 수 있어요",
  people: "이 인원엔 좌석이 살짝 좁거나 넓을 수 있어요",
  budget: "예산보다는 살짝 있는 편이에요",
  access: "이동은 조금 번거로울 수 있어요",
  food: "찾으시는 음식과는 살짝 다를 수 있어요",
  conversation: "대화에 집중하긴 조금 아쉬울 수 있어요",
  mood: "원하시는 분위기와는 살짝 다를 수 있어요",
  seat: "좌석 간격은 넉넉하지 않을 수 있어요",
  reservation: "예약은 조금 번거로울 수 있어요",
  parking: "주차는 마땅치 않을 수 있어요",
};

/** 카드(8.8)의 추천 문구. 예전엔 모든 카드가 place.curatedReason(장소 고정 문구)을 그대로
 *  보여줘서, 조건이 달라도 6개 카드가 같은 톤으로 나열돼 결국 사용자가 직접 다시 비교해야
 *  했다 — 이 조건·이 장소 조합에서 실제로 가장 강한 점(들)을 열고, ratios 중 뚜렷한 약점
 *  (0.5 미만)이 있으면 정직하게 트레이드오프까지 알려준다. relationship/people은 이미
 *  이 문장의 "누구와" 맥락으로 다뤄지므로 강점 후보에서 제외해 카테고리가 겹치지 않게 한다 */
export function generateCardSentence(condition: Condition, match: MatchResult): string {
  const { place, ratios } = match;
  const rankedOthers = (Object.keys(ratios) as ScoreCategory[])
    .filter((k) => k !== "relationship" && k !== "people")
    .sort((a, b) => ratios[b] - ratios[a]);

  const [best, second] = rankedOthers;
  const weakest = rankedOthers[rankedOthers.length - 1];

  const audience = `${AUDIENCE_NOUN[condition.relationship]} ${withConjunctionParticle(PEOPLE_LABEL[condition.people])} 함께`;
  const opening = `${audience} ${POSITIVE_FRAGMENT[best](condition, place)}`;

  if (ratios[weakest] < 0.5 && weakest !== best) {
    return `${opening}. ${CAVEAT_FRAGMENT[weakest]}.`;
  }
  if (second && ratios[second] >= 0.65) {
    return `${opening}. ${POSITIVE_FRAGMENT[second](condition, place)}.`;
  }
  return `${opening}.`;
}

const HEADLINE_NOUN: Record<ScoreCategory, string> = {
  relationship: "관계 궁합",
  people: "인원 적합도",
  budget: "가격",
  access: "접근성",
  food: "음식",
  conversation: "대화",
  mood: "분위기",
  seat: "좌석",
  reservation: "예약",
  parking: "주차",
};

/** 청첩장 모임이라는 맥락 자체를 얼마나 편하게 치를 수 있는지 — 대화가 잘 되는 곳(조용한
 *  편)이면 "차분하게", 캐주얼한 곳이면 "편하게"로 톤을 다르게 표현한다 */
function experiencePhrase(place: Place): string {
  if (place.conversationScore >= 7) return "차분하게 청첩장을 건네기 좋은 곳이에요";
  if (place.formalityTags.includes("casual")) return "편하게 청첩장을 전하기 좋은 곳이에요";
  return "청첩장 모임을 갖기 좋은 곳이에요";
}

export interface Verdict {
  /** "대화와 접근성의 균형이 가장 좋아요" 같은 짧은 결론 헤드라인 */
  headline: string;
  /** 누구와, 어떤 경험에 좋은지 */
  lead: string;
  /** 구체적인 근거(가장 강한 점) 한 문장 */
  detail: string;
  /** 뚜렷한 약점(ratio 0.5 미만)이 있을 때만 채워진다 — 없는데 억지로 트집 잡지 않는다 */
  caveat: string | null;
}

/** 상세 페이지 최상단 "청모픽 한 줄 결론". 체크포인트·추천 이유 카드가 아무리 많아도
 *  "그래서 왜 여기를 고르면 되는지" 최종 판단은 따로 안 내려져 있었다 — 이 페이지에서
 *  가장 먼저 보이는 자리에 청모픽이 대신 결론을 내려준다(누구와/어떤 경험/왜 1순위인지/
 *  뭘 조심해야 하는지 네 가지를 headline+lead+detail+caveat 네 조각으로 나눠 담는다) */
export function generateVerdict(condition: Condition, match: MatchResult): Verdict {
  const { place, ratios } = match;
  const rankedOthers = (Object.keys(ratios) as ScoreCategory[])
    .filter((k) => k !== "relationship" && k !== "people")
    .sort((a, b) => ratios[b] - ratios[a]);
  const [best, second] = rankedOthers;
  const weakest = rankedOthers[rankedOthers.length - 1];

  const headline = second
    ? `${withConjunctionParticle(HEADLINE_NOUN[best])} ${HEADLINE_NOUN[second]}의 균형이 가장 좋아요`
    : `${HEADLINE_NOUN[best]}이 가장 좋아요`;

  const audience = `${AUDIENCE_NOUN[condition.relationship]} ${withConjunctionParticle(PEOPLE_LABEL[condition.people])}`;
  const lead = `${audience} ${experiencePhrase(place)}.`;
  const detail = `${POSITIVE_FRAGMENT[best](condition, place)}.`;
  const caveat = ratios[weakest] < 0.5 ? `${CAVEAT_FRAGMENT[weakest]}.` : null;

  return { headline, lead, detail, caveat };
}

const BUDGET_UPPER: Record<Exclude<Condition["budget"], "any">, number> = {
  "under-20k": 20_000,
  "20-30k": 30_000,
  "30-50k": 50_000,
  "over-50k": Infinity,
};

/** 예약 직전까지 도와주는 실행 조언. 요일별 대기 통계처럼 실제로 확보 못 한 데이터는
 *  지어내지 않고, 이미 있는 필드(reservationMethod/waitingRisk/parkingAvailable 등)에서
 *  합리적으로 끌어낼 수 있는 조언만 만든다 */
export function generateReservationTip(place: Place): string {
  const parts: string[] = [];
  if (place.privateRoomAvailable) {
    parts.push(
      place.reservationMethod === "phone" || place.reservationMethod === "difficult"
        ? "룸을 원한다면 전화로 미리 확인하는 편이 안전해요."
        : "룸을 원한다면 예약 시 함께 요청해보세요.",
    );
  }
  if (place.waitingRisk >= 6) parts.push("피크타임엔 대기가 있을 수 있어요.");
  if (parts.length === 0) parts.push("예약 없이도 비교적 편하게 방문할 수 있는 곳이에요.");
  return parts.join(" ");
}

export function generateOrderTip(place: Place, condition: Condition | null): string {
  if (condition && condition.budget !== "any" && place.priceMax > BUDGET_UPPER[condition.budget]) {
    return `메뉴 구성에 따라 1인 ${formatWon(place.priceMax)}을 넘을 수 있어요. 예산을 맞추려면 메뉴를 먼저 확인해보세요.`;
  }
  return place.seatType === "room"
    ? "코스 위주로 구성된 곳이라, 인원수에 맞는 코스를 미리 정하고 가면 편해요."
    : "메뉴를 나눠서 편하게 즐기기 좋은 구성이에요.";
}

export function generateMeetupTip(place: Place): string {
  if (place.formalityTags.includes("formal") || place.formalityTags.includes("hospitable")) {
    return "너무 격식 차린 느낌이 부담스럽다면 저녁보다 주말 점심이 조금 더 편안해요.";
  }
  return "퇴근 후 저녁에 가볍게 모이기에도 좋은 곳이에요.";
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
