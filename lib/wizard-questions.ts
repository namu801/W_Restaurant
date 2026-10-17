import {
  AREA_HINT,
  AREA_LABEL,
  AREA_OPTIONS,
  BUDGET_LABEL,
  BUDGET_OPTIONS,
  CUISINE_LABEL,
  EXTRA_CONDITION_LABEL,
  EXTRA_CONDITION_OPTIONS,
  PEOPLE_LABEL,
  PEOPLE_OPTIONS,
  RELATIONSHIP_CHIP_LABEL,
  RELATIONSHIP_OPTIONS,
  VIBE_CONDITION,
  VIBE_LABEL,
  VIBE_OPTIONS,
  WIZARD_CUISINE_OPTIONS,
} from "./labels";
import type { Condition } from "./types";

/**
 * 조건입력 질문의 단일 소스. 6화면 위저드(app/search)와 결과 화면의 바텀시트
 * 편집기(components/ConditionEditSheet)가 이 정의를 함께 쓴다.
 *
 * 레퍼런스(다글로·장소 추천 앱·플랜핏)의 공통 문법을 따른다 — 선택지는 짧은 말, 선택지별
 * 설명은 두지 않는다(지역만 같은 줄 회색 한 구절). 분위기와 음식은 사진으로 고른다.
 * 위저드 화면 묶음·머리말·사진은 app/search 쪽에서 정하고, 여기는 질문과 선택지만 정의한다.
 */

export interface OptionDef {
  value: string;
  label: string;
  /** 같은 줄 회색 한 구절(지역 전용) */
  hint?: string;
}

export type SingleKey = "relationship" | "people" | "area" | "budget" | "vibe";

export type MultiKey = "cuisines" | "extraConditions";

export interface SingleQuestion {
  kind: "single";
  key: SingleKey;
  title: string;
  options: OptionDef[];
}

export interface MultiQuestion {
  kind: "multi";
  key: MultiKey;
  title: string;
  max: number;
  required: boolean;
  exclusiveValue?: string;
  options: OptionDef[];
}

export type Question = SingleQuestion | MultiQuestion;

const toOptions = <T extends string>(
  keys: readonly T[],
  labels: Record<T, string>,
  hints?: Partial<Record<T, string>>,
): OptionDef[] => keys.map((value) => ({ value, label: labels[value], hint: hints?.[value] }));

/** 지역은 "어디든 괜찮아요"를 맨 뒤로 보낸다 — 구체적인 역부터 보이는 편이 고르기 쉽다 */
const AREA_ORDER = [...AREA_OPTIONS.filter((a) => a !== "all"), "all" as const];

export const QUESTIONS = {
  relationship: {
    kind: "single",
    key: "relationship",
    title: "누구를 만나세요?",
    options: toOptions(RELATIONSHIP_OPTIONS, RELATIONSHIP_CHIP_LABEL),
  },
  people: {
    kind: "single",
    key: "people",
    title: "인원",
    options: toOptions(PEOPLE_OPTIONS, PEOPLE_LABEL),
  },
  area: {
    kind: "single",
    key: "area",
    title: "지역",
    options: toOptions(AREA_ORDER, { ...AREA_LABEL, all: "어디든 괜찮아요" }, AREA_HINT),
  },
  budget: {
    kind: "single",
    key: "budget",
    title: "한 분당 어느 정도 생각하세요?",
    options: toOptions(BUDGET_OPTIONS, BUDGET_LABEL),
  },
  cuisines: {
    kind: "multi",
    key: "cuisines",
    title: "어떤 음식이 좋을까요?",
    max: 3,
    required: true,
    exclusiveValue: "any",
    options: toOptions(WIZARD_CUISINE_OPTIONS, { ...CUISINE_LABEL, any: "메뉴는 상관없어요" }),
  },
  vibe: {
    kind: "single",
    key: "vibe",
    title: "어떤 분위기의 자리가 좋으세요?",
    options: toOptions(VIBE_OPTIONS, VIBE_LABEL),
  },
  extraConditions: {
    kind: "multi",
    key: "extraConditions",
    title: "꼭 챙겨야 할 게 있나요?",
    max: EXTRA_CONDITION_OPTIONS.length,
    required: false,
    options: toOptions(EXTRA_CONDITION_OPTIONS, EXTRA_CONDITION_LABEL),
  },
} satisfies Record<SingleKey | MultiKey, Question>;

/** 결과 화면 필터 시트에 나열하는 순서 (위저드 화면 순서와 같다) */
export const SHEET_QUESTIONS: Question[] = [
  QUESTIONS.relationship,
  QUESTIONS.people,
  QUESTIONS.area,
  QUESTIONS.budget,
  QUESTIONS.cuisines,
  QUESTIONS.vibe,
  QUESTIONS.extraConditions,
];

export type DraftCondition = Partial<Omit<Condition, "cuisines" | "extraConditions">> & {
  cuisines: string[];
  extraConditions: string[];
};

export function emptyDraft(): DraftCondition {
  return { cuisines: [], extraConditions: [] };
}

export function draftFromCondition(condition: Condition): DraftCondition {
  return { ...condition };
}

export function isDraftComplete(draft: DraftCondition): boolean {
  return Boolean(
    draft.relationship &&
      draft.people &&
      draft.area &&
      draft.budget &&
      draft.cuisines.length > 0 &&
      draft.vibe,
  );
}

/** 완성된 초안을 조건으로 바꾼다. 점수 계산용 noise·moodFormality는 분위기 카드에서 채운다 */
export function conditionFromDraft(draft: DraftCondition): Condition | null {
  if (!isDraftComplete(draft)) return null;
  const vibe = draft.vibe!;
  return {
    relationship: draft.relationship!,
    people: draft.people!,
    area: draft.area!,
    budget: draft.budget!,
    cuisines: draft.cuisines as Condition["cuisines"],
    vibe,
    ...VIBE_CONDITION[vibe],
    extraConditions: draft.extraConditions as Condition["extraConditions"],
  };
}

/** 멀티 셀렉트 토글 로직. exclusiveValue(예: "상관없어요")는 다른 선택을 모두 지우고,
 *  max에 닿으면 더 고르지 못하게 그대로 둔다(가장 먼저 고른 걸 몰래 밀어내지 않는다) */
export function toggleMultiValue(
  current: string[],
  question: MultiQuestion,
  value: string,
): string[] {
  if (current.includes(value)) {
    return current.filter((v) => v !== value);
  }
  if (question.exclusiveValue && value === question.exclusiveValue) {
    return [value];
  }
  const withoutExclusive = question.exclusiveValue
    ? current.filter((v) => v !== question.exclusiveValue)
    : current;
  return withoutExclusive.length >= question.max ? withoutExclusive : [...withoutExclusive, value];
}
