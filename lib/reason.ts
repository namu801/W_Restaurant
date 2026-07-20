import { PEOPLE_LABEL, RELATIONSHIP_LABEL } from "./labels";
import type { Condition, MatchResult, ScoreCategory } from "./types";
import type { ReasonIconKey } from "./icon-keys";

export interface ReasonCard {
  headline: string;
  description: string;
  /** 번호 배지 대신 조건입력 위저드와 같은 아이콘을 쓴다. 실제 컴포넌트가 아니라 키만
   *  담는 이유는 lib/checkpoints.ts 상단 주석 참고 (서버→클라이언트 함수 직렬화 문제) */
  icon: ReasonIconKey;
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

/** 결과 카드(8.8)의 "핵심 강점 태그"용 짧은 라벨 */
export function cardTagLabel(key: ScoreCategory): string {
  switch (key) {
    case "relationship":
      return "관계 적합";
    case "people":
      return "인원 적합";
    case "budget":
      return "예산 적합";
    case "access":
      return "역 접근성 좋음";
    case "food":
      return "음식 취향 적중";
    case "conversation":
      return "대화하기 좋음";
    case "mood":
      return "분위기 좋음";
    case "seat":
      return "좌석 여유";
    case "reservation":
      return "예약 편의";
    case "parking":
      return "주차 가능";
  }
}

/** 결과 카드(8.8)용: 알고리즘이 판단한 핵심 강점 태그 2~3개 (적합도 비율 상위 카테고리) */
export function topStrengthTags(match: MatchResult, n = 3): string[] {
  const keys = Object.keys(match.ratios) as ScoreCategory[];
  const strong = keys.filter((k) => match.ratios[k] >= 0.75).sort((a, b) => match.ratios[b] - match.ratios[a]);
  const picked = (strong.length > 0 ? strong : topStrengths(match, 2)).slice(0, n);
  return picked.map(cardTagLabel);
}

/** 장소 상세(8.9)용 "왜 추천하나요" 카드 3장. 조건에서 가장 잘 맞는 2개 기준 +
 *  이 식당만의 실제 큐레이션 문구(curatedReason)를 마지막 카드로 붙여서, 조건이 같아도
 *  식당마다 다른 3번째 카드가 나오게 한다 */
export function generateDetailReason(condition: Condition, match: MatchResult): ReasonCard[] {
  const [s1, s2] = topStrengths(match);
  return [
    reasonCard(s1, condition),
    reasonCard(s2, condition),
    { headline: "이 식당만의 매력이에요", description: match.place.curatedReason, icon: "sparkles" },
  ];
}

/** 조건 컨텍스트 없이(예: 북마크함) 장소를 볼 때 쓰는 기본 추천 이유 */
export function genericReason(curatedReason: string): ReasonCard[] {
  return [{ headline: "이 식당의 특징이에요", description: curatedReason, icon: "sparkles" }];
}
