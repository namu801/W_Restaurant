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
    // step_number는 screen.stageIndex(모임정보/식사조건/분위기·공간/운영조건 4개)가 아니라
    // screenIndex(관계·인원·지역·예산·음식·소음·분위기·추가조건, 실제 8개 질문 화면) 기준이어야
    // 한다 — stageIndex를 쓰면 같은 스테이지 안 여러 질문이 같은 번호로 찍혀서, 화면에 보이는
    // "n/8" 진행률과도 어긋나고 믹스패널에서 8단계 중 정확히 어디서 이탈하는지 구분이 안 됐다
    track("filter_step_viewed", {
      step_number: screenIndex + 1,
      step_name: question.key,
      stage_name: screen.stageName,
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
      step_number: screenIndex + 1,
      step_name: question.key,
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

    track("filter_skipped", { step_number: screenIndex + 1, step_name: question.key });
    router.push(`/search/loading?${conditionToSearchParams(condition).toString()}`);
  }

  return (
    <>
      {/* 위저드는 화면마다 상단 영역의 "역할"이 달라서 공용 Header(로고)를 아예 끄고
          (Header.tsx 참고) 이 화면 전용 상단바를 프레임 기준 absolute로 직접 그린다 —
          BottomNav와 같은 방식이라 <main>이 스크롤돼도 항상 프레임 맨 위에 고정된다.
          레퍼런스(단어 학습 앱) 배치를 그대로 가져왔다 — 좌: 뒤로가기, 가운데: 현재 단계,
          우: 텍스트 버튼. 뒤로가기는 장소 상세 페이지의 뒤로가기와 높이·위치·스타일을
          그대로 맞췄다. 우측 버튼은 레퍼런스의 "읽어주기"(적극 액션)와 달리 "건너뛰기"라
          강조색을 쓰면 이탈을 부추기는 신호가 된다 — 잉크 톤으로만, 가운데보다 뚜렷하게
          작게 둔다. 가운데 라벨이 좌우 버튼 폭 차이와 무관하게 항상 정중앙에 오도록
          flex justify-between 대신 3열 grid(좌우 1fr + 가운데 auto)로 짠다. */}
      <div className="absolute inset-x-0 top-0 z-20 bg-cream px-6 pb-4 pt-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            aria-label={screenIndex === 0 ? "홈으로 나가기" : "이전 질문"}
            className="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center justify-self-start rounded-full text-ink transition-colors hover:bg-cream-strong active:bg-cream-strong"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>

          {/* 스테이지명은 아래 질문 제목(h1)이 이미 맡고 있어 여기서는 순수 진행률(n/N)만
              보여준다 — 건너뛰기보다는 크지만, 진짜 주인공인 질문 제목(text-xl)보다는
              작고 옅은 톤으로 눌러서 위계가 제목에서 밀리지 않게 한다 */}
          <p className="justify-self-center text-lg font-medium text-ink-soft">
            {screenIndex + 1}/{SCREENS.length}
          </p>

          <button
            type="button"
            onClick={handleSkip}
            className="justify-self-end text-sm font-medium text-ink-faint hover:text-ink-soft"
          >
            건너뛰기
          </button>
        </div>

        {/* 레퍼런스처럼 세그먼트로 쪼개지 않은 하나의 연속된 바로 바꾸고, 단계가 바뀔 때마다
            채워진 너비가 부드럽게 늘어나는 인터랙션을 준다. 이 상단바 자체의 좌우 패딩(px-6)을
            -mx-6로 상쇄해서 화면 끝까지 번지게 한다(레퍼런스도 풀블리드). */}
        <div
          className="mt-4 -mx-6 h-1.5 bg-line"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={SCREENS.length}
          aria-valuenow={screenIndex + 1}
          aria-label={`전체 ${SCREENS.length}개 질문 중 ${screenIndex + 1}번째: ${screen.stageName}`}
        >
          <div
            className="h-full rounded-r-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${((screenIndex + 1) / SCREENS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6">
      <div>
        {/* 음식·추가조건처럼 여러 개 고를 수 있는 질문은 "최대 4개까지" 안내만으론 지금 몇 개
            골랐는지 매번 세어봐야 했다 — 제목 옆에 (n/max)를 실시간으로 붙여서 선택할 때마다
            바로바로 갱신되게 한다 */}
        <h1 className="text-xl font-bold leading-snug tracking-tight text-ink text-balance">
          {question.title}
          {question.kind === "multi" && (
            <span className="ml-1.5 text-ink-soft">
              ({((draft[question.key] as string[]) ?? []).length}/{question.max})
            </span>
          )}
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
                  "flex min-h-14 items-center gap-2.5 rounded-md border p-3 text-left transition",
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
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent py-3.5 text-[15px] font-bold text-white transition-all hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLastScreen ? "추천 결과 보기" : "다음"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </StickyBottomBar>
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchWizard />
    </Suspense>
  );
}
