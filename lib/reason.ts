import { AREA_LABEL, RELATIONSHIP_LABEL } from "./labels";
import type { Condition, MatchResult, ScoreCategory } from "./types";

/** 받침 유무에 따라 "이"/"가" 조사를 고른다. 한글이 아닌 문자로 끝나면 안전하게 "가"를 쓴다.
 *  strengthClause 문구 중 절반은 받침 있는 글자로 끝나("좌석", "환경" 등) "가"를 그냥 붙이면
 *  "좌석가 있는"처럼 비문이 된다 */
function withIga(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return `${word}가`;
  const hasBatchim = (code - 0xac00) % 28 !== 0;
  return `${word}${hasBatchim ? "이" : "가"}`;
}

function strengthClause(key: ScoreCategory): string {
  switch (key) {
    case "relationship":
      return "관계에 맞는 분위기";
    case "people":
      return "인원수에 알맞은 좌석";
    case "budget":
      return "예산에 부담스럽지 않은 가격대";
    case "access":
      return "역 접근성";
    case "food":
      return "선호하는 음식 종류";
    case "conversation":
      return "대화하기 좋은 환경";
    case "mood":
      return "원하는 분위기와 대접감";
    case "seat":
      return "여유 있는 좌석";
    case "reservation":
      return "예약·웨이팅 편의";
    case "parking":
      return "주차 편의";
  }
}

function strengthNoun(key: ScoreCategory): string {
  switch (key) {
    case "relationship":
      return "관계 적합도";
    case "people":
      return "인원 적합도";
    case "budget":
      return "예산 적합도";
    case "access":
      return "역 접근성";
    case "food":
      return "음식 적합도";
    case "conversation":
      return "대화 가능성";
    case "mood":
      return "분위기·대접감";
    case "seat":
      return "좌석·공간 적합도";
    case "reservation":
      return "예약·웨이팅 편의";
    case "parking":
      return "주차 편의";
  }
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

function topStrengths(match: MatchResult, n = 2): ScoreCategory[] {
  const keys = Object.keys(match.ratios) as ScoreCategory[];
  return keys.sort((a, b) => match.ratios[b] - match.ratios[a]).slice(0, n);
}

/** 결과 카드(8.8)용: 알고리즘이 판단한 핵심 강점 태그 2~3개 (적합도 비율 상위 카테고리) */
export function topStrengthTags(match: MatchResult, n = 3): string[] {
  const keys = Object.keys(match.ratios) as ScoreCategory[];
  const strong = keys.filter((k) => match.ratios[k] >= 0.75).sort((a, b) => match.ratios[b] - match.ratios[a]);
  const picked = (strong.length > 0 ? strong : topStrengths(match, 2)).slice(0, n);
  return picked.map(cardTagLabel);
}

/** 결과 목록용 한 줄 추천 이유. 캐치테이블의 짧은 소개 문구를 참고했지만, 실제로는 AI가
 *  아니라 룰 기반 채점 결과라 "AI"라고 붙이지 않는다 — 있는 그대로만 말한다 */
export function generateListReason(condition: Condition, match: MatchResult): string {
  const [s1] = topStrengths(match, 1);
  return `${RELATIONSHIP_LABEL[condition.relationship]} 모임에 ${withIga(strengthClause(s1))} 있는 곳이에요.`;
}

/** 장소 상세(8.9)용 템플릿 기반 추천 이유 (PRD 11.10 Option B) */
export function generateDetailReason(condition: Condition, match: MatchResult): string {
  const [s1, s2] = topStrengths(match);
  const relationshipLabel = RELATIONSHIP_LABEL[condition.relationship];
  const areaLabel = AREA_LABEL[condition.area];
  return [
    `${relationshipLabel}에게 청첩장을 전달하는 자리라면 ${strengthClause(
      s1,
    )}가 있는 장소가 적합해요.`,
    `이 장소는 ${strengthNoun(s1)}, ${strengthNoun(s2)} 기준에서 잘 맞아 ${areaLabel} 후보로 추천해요.`,
    `다만 ${match.place.cautionNote} 확인해보는 것이 좋아요.`,
  ].join(" ");
}

/** 조건 컨텍스트 없이(예: 북마크함) 장소를 볼 때 쓰는 기본 추천 이유 */
export function genericReason(curatedReason: string): string {
  return curatedReason;
}
