"use client";

import { clsx } from "clsx";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { conditionToSearchParams, searchParamsToCondition } from "@/lib/condition-query";
import { track } from "@/lib/analytics";
import { StickyBottomBar } from "@/components/StickyBottomBar";
import { OptionBadge } from "@/components/OptionBadge";
import { BudgetSlider } from "@/components/BudgetSlider";
import {
  SCREENS,
  emptyDraft,
  draftFromCondition,
  toggleMultiValue,
  type DraftCondition,
  type MultiQuestion,
  type SingleKey,
} from "@/lib/wizard-questions";
import type { Condition } from "@/lib/types";

function SearchWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [screenIndex, setScreenIndex] = useState(0);
  const [draft, setDraft] = useState<DraftCondition>(emptyDraft());
  const sessionId = useMemo(
    () => (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}`),
    [],
  );

  useEffect(() => {
    const prefill = searchParamsToCondition(searchParams);
    if (prefill) setDraft(draftFromCondition(prefill));
    track("filter_flow_started", { session_id: sessionId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const screen = SCREENS[screenIndex];
  const { question } = screen;
  const isLastScreen = screenIndex === SCREENS.length - 1;

  useEffect(() => {
    track("filter_step_viewed", {
      step_number: screen.stageIndex + 1,
      step_name: screen.stageName,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenIndex]);

  function selectSingle(key: SingleKey, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    track("filter_option_selected", { condition_type: key, condition_value: value });
  }

  function toggleMulti(question: MultiQuestion, value: string) {
    setDraft((prev) => ({
      ...prev,
      [question.key]: toggleMultiValue((prev[question.key] as string[]) ?? [], question, value),
    }));
    track("filter_option_selected", { condition_type: question.key, condition_value: value });
  }

  function canProceed(): boolean {
    if (question.kind === "single") {
      return typeof draft[question.key] === "string" && (draft[question.key] as string).length > 0;
    }
    if (!question.required) return true;
    return (draft[question.key] as string[]).length > 0;
  }

  function handleNext() {
    if (!canProceed()) return;

    track("filter_step_completed", {
      step_number: screen.stageIndex + 1,
      completion_time: Date.now(),
    });

    if (!isLastScreen) {
      setScreenIndex((i) => i + 1);
      return;
    }

    const condition: Condition = {
      relationship: draft.relationship!,
      people: draft.people!,
      area: draft.area!,
      budget: draft.budget!,
      cuisines: draft.cuisines as Condition["cuisines"],
      noise: draft.noise!,
      moodFormality: draft.moodFormality!,
      extraConditions: draft.extraConditions as Condition["extraConditions"],
    };

    track("filter_submitted", {
      relationship: condition.relationship,
      people: condition.people,
      area: condition.area,
      budget: condition.budget,
    });

    router.push(`/search/loading?${conditionToSearchParams(condition).toString()}`);
  }

  function handlePrev() {
    if (screenIndex === 0) {
      router.push("/");
      return;
    }
    setScreenIndex((i) => i - 1);
  }

  /** 스텝이 많다 보니 조건을 하나도 안 고르고 바로 결과부터 보고 싶은 사람도 있다.
   *  지금까지 답한 건 그대로 쓰고, 나머지는 "상관없음"에 가까운 값으로 채워 넘어간다.
   *  관계·인원은 그런 값이 없어 각각 "기타"/"3~4명"으로 중립값을 둔다 */
  function handleSkip() {
    const condition: Condition = {
      relationship: draft.relationship ?? "other",
      people: draft.people ?? "3-4",
      area: draft.area ?? "all",
      budget: draft.budget ?? "any",
      cuisines: (draft.cuisines && draft.cuisines.length > 0 ? draft.cuisines : ["any"]) as Condition["cuisines"],
      noise: draft.noise ?? "any",
      moodFormality: draft.moodFormality ?? "any",
      extraConditions: (draft.extraConditions ?? []) as Condition["extraConditions"],
    };

    track("filter_skipped", { step_number: screen.stageIndex + 1 });
    router.push(`/search/loading?${conditionToSearchParams(condition).toString()}`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 상단 정보 영역이 너무 넓어 보였던 걸, 실제 조작 대상(뒤로가기+진행률)을 한 줄로
          묶고, 부가 정보(단계 라벨+건너뛰기)는 그 아래 더 작은 글씨의 보조 줄로 낮춰서 정리했다.
          뒤로가기와 진행률 바가 같은 위계에 있어도 자연스럽다. 두 줄을 gap-2로 붙여
          "하나의 헤더 블록"처럼 묶고, 다음 콘텐츠와는 바깥 gap-6로 거리를 둔다 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            aria-label={screenIndex === 0 ? "홈으로 나가기" : "이전 질문"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-line-strong active:bg-cream-strong"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          {/* 4단계로 뭉뚱그리면 "겨우 4단계인데 왜 이렇게 많이 물어보지" 싶은 착시가 생긴다.
              실제 화면 수(9개) 그대로 세그먼트를 나눠서 진행 정도를 정직하게 보여준다. */}
          <div
            className="flex flex-1 gap-1"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={SCREENS.length}
            aria-valuenow={screenIndex + 1}
            aria-label={`전체 ${SCREENS.length}개 질문 중 ${screenIndex + 1}번째: ${screen.stageName}`}
          >
            {SCREENS.map((_, i) => (
              <div
                key={i}
                className={clsx(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= screenIndex ? "bg-accent" : "bg-sage-soft",
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-ink-faint">
            {screen.stageName} · {screenIndex + 1}/{SCREENS.length}
          </p>
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-medium text-ink-faint underline-offset-2 hover:text-ink-soft hover:underline"
          >
            건너뛰기
          </button>
        </div>
      </div>

      <div>
        <h1 className="font-serif text-xl font-bold leading-snug text-ink text-balance">
          {question.title}
        </h1>
        {question.helper && <p className="mt-2 text-sm text-ink-soft">{question.helper}</p>}
      </div>

      {question.key === "budget" ? (
        <BudgetSlider
          value={draft.budget}
          onChange={(value) => selectSingle("budget", value)}
        />
      ) : (
        // 기본은 2열이지만, 라벨이 한 줄 문장급으로 길어 2열에서 줄바꿈되면 지저분해 보이는
        // 질문(소음·분위기)은 columns: 1로 세로 1열 나열한다
        <div
          className={clsx(
            "grid gap-2.5",
            question.kind === "single" && question.columns === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {question.options.map((option) => {
            const isMulti = question.kind === "multi";
            const selected = isMulti
              ? ((draft[question.key] as string[]) ?? []).includes(option.value)
              : draft[question.key] === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  isMulti ? toggleMulti(question, option.value) : selectSingle(question.key, option.value)
                }
                className={clsx(
                  // 스텝마다 뱃지 유무·라벨 길이가 달라 높이가 들쭉날쭉했다. min-h-14로 기본 높이는
                  // 모든 스텝에서 맞추되, 말줄임(...)은 절대 쓰지 않는다 — 라벨이 길면 카드가
                  // 그만큼 자연스럽게 늘어나 두 줄까지 허용한다
                  "flex min-h-14 items-center gap-2.5 rounded-md border p-3 text-left transition active:scale-[0.98]",
                  selected
                    ? "border-accent bg-accent-soft"
                    : "border-line bg-cream-soft hover:border-line-strong active:bg-cream-strong",
                )}
              >
                <OptionBadge question={question} option={option} />
                <span
                  className={clsx(
                    "min-w-0 flex-1 text-sm font-semibold leading-snug",
                    selected ? "text-accent-strong" : "text-ink",
                  )}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <StickyBottomBar>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed()}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-accent-strong active:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLastScreen ? "추천 결과 보기" : "다음"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </StickyBottomBar>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchWizard />
    </Suspense>
  );
}
