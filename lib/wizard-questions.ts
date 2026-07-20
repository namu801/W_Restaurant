import {
  AREA_LABEL,
  AREA_OPTIONS,
  BUDGET_LABEL,
  BUDGET_OPTIONS,
  CUISINE_LABEL,
  CUISINE_OPTIONS,
  EXTRA_CONDITION_LABEL,
  EXTRA_CONDITION_OPTIONS,
  MOOD_FORMALITY_LABEL,
  MOOD_FORMALITY_OPTIONS,
  NOISE_LABEL,
  NOISE_OPTIONS,
  PEOPLE_LABEL,
  PEOPLE_OPTIONS,
  RELATIONSHIP_LABEL,
  RELATIONSHIP_OPTIONS,
} from "./labels";
import {
  CUISINE_ICON,
  EXTRA_CONDITION_ICON,
  MOOD_FORMALITY_ICON,
  NOISE_ICON,
  RELATIONSHIP_ICON,
  type CategoryIcon,
} from "./option-icons";
import type { Condition } from "./types";

/**
 * 조건입력 질문의 단일 소스. 전체 스텝 위저드(app/search)와
 * 결과 화면의 바텀시트 편집기(components/ConditionEditSheet)가 이 정의를 함께 쓴다.
 */

export interface OptionDef {
  value: string;
  label: string;
  icon?: CategoryIcon;
}

export type SingleKey = "relationship" | "people" | "area" | "budget" | "noise" | "moodFormality";

export type MultiKey = "cuisines" | "extraConditions";

export interface SingleQuestion {
  kind: "single";
  key: SingleKey;
  title: string;
  helper?: string;
  /** 라벨이 한 줄 문장급으로 길어 2열에서 줄바꿈되면 지저분해 보이는 질문은 1열로 세로 나열한다 */
  columns?: 1 | 2;
  options: OptionDef[];
}

export interface MultiQuestion {
  kind: "multi";
  key: MultiKey;
  title: string;
  helper: string;
  max: number;
  required: boolean;
  exclusiveValue?: string;
  options: OptionDef[];
}

export type Question = SingleQuestion | MultiQuestion;

export interface Stage {
  name: string;
  questions: Question[];
}

const toOptions = <T extends string>(
  keys: readonly T[],
  labels: Record<T, string>,
  icons?: Record<T, CategoryIcon>,
): OptionDef[] => keys.map((value) => ({ value, label: labels[value], icon: icons?.[value] }));

export const STAGES: Stage[] = [
  {
    name: "모임 정보",
    questions: [
      {
        kind: "single",
        key: "relationship",
        title: "누구와 만나는 자리인가요?",
        helper: "관계에 따라 편한 분위기와 예산이 달라져요.",
        options: toOptions(RELATIONSHIP_OPTIONS, RELATIONSHIP_LABEL, RELATIONSHIP_ICON),
      },
      {
        kind: "single",
        key: "people",
        title: "몇 명이 모이나요?",
        helper: "인원에 맞는 좌석과 예약 가능한 곳을 찾아볼게요.",
        options: toOptions(PEOPLE_OPTIONS, PEOPLE_LABEL),
      },
      {
        kind: "single",
        key: "area",
        title: "어디에서 만날까요?",
        helper: "모두가 오기 편한 지역을 골라주세요.",
        options: toOptions(AREA_OPTIONS, AREA_LABEL),
      },
    ],
  },
  {
    name: "식사 조건",
    questions: [
      {
        kind: "single",
        key: "budget",
        title: "한 사람당 최대 얼마까지 괜찮나요?",
        helper: "식사와 음료를 포함한 예상 금액이에요.",
        options: toOptions(BUDGET_OPTIONS, BUDGET_LABEL),
      },
      {
        kind: "multi",
        key: "cuisines",
        title: "먹고 싶은 메뉴가 있나요?",
        helper: "최대 4개까지 고를 수 있어요.",
        max: 4,
        required: true,
        exclusiveValue: "any",
        options: toOptions(CUISINE_OPTIONS, CUISINE_LABEL, CUISINE_ICON),
      },
    ],
  },
  {
    name: "분위기·공간",
    questions: [
      {
        kind: "single",
        key: "noise",
        title: "얼마나 조용한 곳이 좋나요?",
        helper: "청첩장을 건네고 이야기 나누기 편한 정도를 골라주세요.",
        columns: 1,
        options: toOptions(NOISE_OPTIONS, NOISE_LABEL, NOISE_ICON),
      },
      {
        kind: "single",
        key: "moodFormality",
        title: "어떤 분위기에서 만나고 싶나요?",
        helper: "편안함부터 격식까지, 가장 가까운 분위기를 골라주세요.",
        columns: 1,
        options: toOptions(MOOD_FORMALITY_OPTIONS, MOOD_FORMALITY_LABEL, MOOD_FORMALITY_ICON),
      },
    ],
  },
  {
    name: "운영 조건",
    questions: [
      {
        kind: "multi",
        key: "extraConditions",
        title: "꼭 필요한 조건이 있나요?",
        helper: "꼭 필요한 조건만 골라주세요. 없어도 괜찮아요.",
        max: EXTRA_CONDITION_OPTIONS.length,
        required: false,
        options: toOptions(EXTRA_CONDITION_OPTIONS, EXTRA_CONDITION_LABEL, EXTRA_CONDITION_ICON),
      },
    ],
  },
];

/** STAGES를 평평하게 펼친 질문 화면 목록. 전체 위저드의 스텝 진행과 바텀시트의 전체 나열에 함께 쓴다 */
export const SCREENS = STAGES.flatMap((stage, stageIndex) =>
  stage.questions.map((question) => ({ stageIndex, stageName: stage.name, question })),
);

export type DraftCondition = Partial<Condition> & {
  cuisines: string[];
  extraConditions: string[];
};

export function emptyDraft(): DraftCondition {
  return { cuisines: [], extraConditions: [] };
}

export function draftFromCondition(condition: Condition): DraftCondition {
  return { ...condition };
}

export function isDraftComplete(draft: DraftCondition): draft is Condition {
  return Boolean(
    draft.relationship &&
      draft.people &&
      draft.area &&
      draft.budget &&
      draft.cuisines.length > 0 &&
      draft.noise &&
      draft.moodFormality,
  );
}

/** 멀티 셀렉트 토글 로직. exclusiveValue(예: "상관없어요")는 다른 선택을 모두 지우고, max 초과 시 가장 먼저 고른 값을 밀어낸다 */
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
  return withoutExclusive.length >= question.max
    ? [...withoutExclusive.slice(1), value]
    : [...withoutExclusive, value];
}
