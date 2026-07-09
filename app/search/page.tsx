"use client";

import { clsx } from "clsx";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ALCOHOL_LABEL,
  ALCOHOL_OPTIONS,
  AREA_LABEL,
  AREA_OPTIONS,
  AVOID_LABEL,
  AVOID_OPTIONS,
  BUDGET_LABEL,
  BUDGET_OPTIONS,
  MOOD_LABEL,
  MOOD_OPTIONS,
  PEOPLE_LABEL,
  PEOPLE_OPTIONS,
  RELATIONSHIP_LABEL,
  RELATIONSHIP_OPTIONS,
} from "@/lib/labels";
import { conditionToSearchParams } from "@/lib/condition-query";
import { track } from "@/lib/analytics";
import type { Condition } from "@/lib/types";

interface StepDef {
  key: keyof Condition;
  title: string;
  helper?: string;
  type: "single" | "multi";
  required: boolean;
  options: { value: string; label: string }[];
}

const STEPS: StepDef[] = [
  {
    key: "relationship",
    title: "누구와의 모임인가요?",
    type: "single",
    required: true,
    options: RELATIONSHIP_OPTIONS.map((v) => ({ value: v, label: RELATIONSHIP_LABEL[v] })),
  },
  {
    key: "people",
    title: "몇 명이 모이나요?",
    type: "single",
    required: true,
    options: PEOPLE_OPTIONS.map((v) => ({ value: v, label: PEOPLE_LABEL[v] })),
  },
  {
    key: "budget",
    title: "1인 예산은 어느 정도인가요?",
    type: "single",
    required: true,
    options: BUDGET_OPTIONS.map((v) => ({ value: v, label: BUDGET_LABEL[v] })),
  },
  {
    key: "alcohol",
    title: "술자리인가요?",
    type: "single",
    required: true,
    options: ALCOHOL_OPTIONS.map((v) => ({ value: v, label: ALCOHOL_LABEL[v] })),
  },
  {
    key: "moods",
    title: "원하는 분위기가 있나요?",
    helper: "선택하지 않아도 괜찮아요 (복수 선택 가능)",
    type: "multi",
    required: false,
    options: MOOD_OPTIONS.map((v) => ({ value: v, label: MOOD_LABEL[v] })),
  },
  {
    key: "avoid",
    title: "피하고 싶은 조건이 있나요?",
    helper: "선택하지 않아도 괜찮아요 (복수 선택 가능)",
    type: "multi",
    required: false,
    options: AVOID_OPTIONS.map((v) => ({ value: v, label: AVOID_LABEL[v] })),
  },
  {
    key: "area",
    title: "어느 지역에서 만나나요?",
    type: "single",
    required: true,
    options: AREA_OPTIONS.map((v) => ({ value: v, label: AREA_LABEL[v] })),
  },
];

type DraftCondition = Partial<Condition> & { moods: string[]; avoid: string[] };

export default function SearchPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<DraftCondition>({ moods: [], avoid: [] });
  const sessionId = useMemo(
    () => (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}`),
    [],
  );

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  useEffect(() => {
    track("condition_step_viewed", { session_id: sessionId, step: step.key });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  function selectSingle(key: keyof Condition, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    track("condition_option_selected", { option_type: key, option_value: value });
  }

  function toggleMulti(key: "moods" | "avoid", value: string) {
    setDraft((prev) => {
      const current = prev[key] as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
    track("condition_option_selected", { option_type: key, option_value: value });
  }

  function canProceed(): boolean {
    if (!step.required) return true;
    const value = draft[step.key];
    return typeof value === "string" && value.length > 0;
  }

  function handleNext() {
    if (!canProceed()) return;
    if (!isLastStep) {
      setStepIndex((i) => i + 1);
      return;
    }

    const condition: Condition = {
      relationship: draft.relationship!,
      people: draft.people!,
      budget: draft.budget!,
      alcohol: draft.alcohol!,
      area: draft.area!,
      moods: draft.moods as Condition["moods"],
      avoid: draft.avoid as Condition["avoid"],
    };

    track("condition_submitted", {
      relationship: condition.relationship,
      people_count: condition.people,
      budget: condition.budget,
      area: condition.area,
    });

    router.push(`/results?${conditionToSearchParams(condition).toString()}`);
  }

  function handlePrev() {
    if (stepIndex === 0) {
      router.push("/");
      return;
    }
    setStepIndex((i) => i - 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium text-ink-faint">
          {stepIndex + 1} / {STEPS.length}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line-soft">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div>
        <h1 className="text-lg font-semibold text-ink">{step.title}</h1>
        {step.helper && <p className="mt-1 text-sm text-ink-faint">{step.helper}</p>}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {step.options.map((option) => {
          const isMulti = step.type === "multi";
          const selected = isMulti
            ? (draft[step.key] as string[])?.includes(option.value)
            : draft[step.key] === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                isMulti
                  ? toggleMulti(step.key as "moods" | "avoid", option.value)
                  : selectSingle(step.key, option.value)
              }
              className={clsx(
                "rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors",
                selected
                  ? "border-accent bg-accent-soft text-accent-strong"
                  : "border-line bg-white text-ink-soft hover:border-ink-faint",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2.5">
        <button
          type="button"
          onClick={handlePrev}
          className="inline-flex items-center gap-1 rounded-full border border-line px-4 py-3 text-sm font-medium text-ink-soft hover:border-ink-faint"
        >
          <ArrowLeft className="h-4 w-4" />
          이전
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed()}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-cream transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLastStep ? "추천 보기" : "다음"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
