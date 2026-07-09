import { AREA_LABEL, PEOPLE_LABEL, RELATIONSHIP_LABEL } from "./labels";
import type { Condition, MatchResult } from "./types";

type SubScoreKey = keyof MatchResult["subScores"];

const SUB_SCORE_MAX: Record<SubScoreKey, number> = {
  relationship: 25,
  people: 15,
  budget: 15,
  mood: 15,
  alcohol: 10,
  access: 10,
  conversation: 10,
};

function strengthClause(key: SubScoreKey, condition: Condition): string {
  switch (key) {
    case "relationship":
      return "관계에 맞는 분위기";
    case "people":
      return "인원수에 알맞은 좌석";
    case "budget":
      return "예산에 부담스럽지 않은 가격대";
    case "mood":
      return "원하는 분위기";
    case "alcohol":
      return condition.alcohol === "with-alcohol"
        ? "술자리로도 무리 없는 구성"
        : "가볍게 식사하기 좋은 구성";
    case "access":
      return "역 접근성";
    case "conversation":
      return "대화하기 좋은 환경";
  }
}

function strengthNoun(key: SubScoreKey): string {
  switch (key) {
    case "relationship":
      return "관계 적합도";
    case "people":
      return "인원 적합도";
    case "budget":
      return "예산 적합도";
    case "mood":
      return "분위기 적합도";
    case "alcohol":
      return "술/무알콜 적합도";
    case "access":
      return "역 접근성";
    case "conversation":
      return "대화 가능성";
  }
}

function topStrengths(match: MatchResult, condition: Condition, n = 2) {
  const keys = Object.keys(match.subScores) as SubScoreKey[];
  return keys
    .map((key) => ({ key, ratio: match.subScores[key] / SUB_SCORE_MAX[key] }))
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, n)
    .map(({ key }) => key);
}

/** 결과 카드(8.3)용 3줄 추천 이유: 관계+인원, 강점 2가지, 확인할 점 */
export function generateCardReason(
  condition: Condition,
  match: MatchResult,
): { headline: string; strengthLine: string; cautionLine: string } {
  const [s1, s2] = topStrengths(match, condition);
  const headline = `${RELATIONSHIP_LABEL[condition.relationship]} ${
    PEOPLE_LABEL[condition.people]
  } 모임에 ${match.fitLabel === "보통" ? "고려해볼 만해요" : match.fitLabel === "적합" ? "무난해요" : "잘 어울려요"}.`;
  const strengthLine = `${strengthClause(s1, condition)}, ${strengthClause(
    s2,
    condition,
  )}예요.`;
  const cautionLine = `다만 ${match.place.cautionNote}`;
  return { headline, strengthLine, cautionLine };
}

/** 장소 상세(8.4)용 템플릿 기반 추천 이유 (PRD 11.4 Option B) */
export function generateDetailReason(
  condition: Condition,
  match: MatchResult,
): string {
  const [s1, s2] = topStrengths(match, condition);
  const relationshipLabel = RELATIONSHIP_LABEL[condition.relationship];
  const areaLabel = AREA_LABEL[condition.area];
  return [
    `${relationshipLabel}에게 청첩장을 전달하는 자리라면 ${strengthClause(
      s1,
      condition,
    )}가 있는 장소가 적합해요.`,
    `이 장소는 ${strengthNoun(s1)}, ${strengthNoun(
      s2,
    )} 기준에서 잘 맞아 ${areaLabel} 후보로 추천해요.`,
    `다만 ${match.place.cautionNote} 확인해보는 것이 좋아요.`,
  ].join(" ");
}

/** 조건 컨텍스트 없이(예: 북마크함) 장소를 볼 때 쓰는 기본 추천 이유 */
export function genericReason(curatedReason: string): string {
  return curatedReason;
}
