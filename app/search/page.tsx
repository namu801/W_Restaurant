"use client";

import { clsx } from "clsx";
import Image from "next/image";
import { ArrowLeft, Check, Sparkle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { conditionToSearchParams, searchParamsToCondition } from "@/lib/condition-query";
import { track } from "@/lib/analytics";
import { StickyBottomBar } from "@/components/StickyBottomBar";
import { TypingText } from "@/components/TypingText";
import { BudgetSlider } from "@/components/BudgetSlider";
import { AREA_LABEL, BUDGET_LABEL, PEOPLE_LABEL, VIBE_LABEL, VIBE_MOOD } from "@/lib/labels";
import {
  QUESTIONS,
  conditionFromDraft,
  draftFromCondition,
  emptyDraft,
  toggleMultiValue,
  type DraftCondition,
  type MultiQuestion,
  type SingleKey,
} from "@/lib/wizard-questions";
import { cuisinePhoto, vibePhoto } from "@/lib/wizard-photos";
import type { Condition, CuisineKey, RelationshipKey, VibeKey } from "@/lib/types";

/**
 * 조건 입력 6화면. 레퍼런스(다글로·장소 추천 앱·플랜핏)의 공통 문법을 따른다.
 * - 선택지는 짧은 말. 선택지별 설명은 두지 않는다(지역만 같은 줄 회색 한 구절).
 * - 앞에서 고른 내용은 다음 질문 위 주황 한 줄(머리말)로 받아준다. 따로 응답 영역을 두지 않는다.
 * - 가벼운 질문(인원·지역)은 한 화면에 묶는다.
 * - 메뉴가 공간 성격을 크게 정해서 음식을 분위기보다 먼저 묻고, 둘 다 사진으로 고른다.
 */
const STEPS = [
  { name: "relationship", title: "누구를 만나세요?", help: null },
  { name: "people_area", title: "몇 분과, 어디서 만나세요?", help: null },
  { name: "budget", title: "한 분당 어느 정도 생각하세요?", help: "식사와 음료를 포함한 금액이에요" },
  { name: "cuisines", title: "어떤 음식이 좋을까요?", help: "최대 3개까지 고를 수 있어요" },
  { name: "vibe", title: "어떤 분위기의 자리가 좋으세요?", help: "가장 가까운 한 곳을 골라주세요" },
  { name: "extra", title: "꼭 챙겨야 할 게 있나요?", help: "없으면 바로 결과를 볼 수 있어요" },
] as const;

/** ② 머리말. "~자리군요"로 관계를 받아준다 */
const RELATIONSHIP_ECHO: Record<RelationshipKey, string> = {
  "close-friend": "가까운 친구와 편하게 만나는 자리군요",
  "friend-group": "친구들과 다 같이 모이는 자리군요",
  coworker: "동료들과 함께하는 자리군요",
  "workplace-senior": "선배·상사를 모시는 자리군요",
  "school-senior": "학교 선후배와 만나는 자리군요",
  family: "어른들이 함께하시는 자리군요",
  other: "소중한 분을 만나는 자리군요",
};

/** 다음 질문 위에 붙는 머리말. 단계마다 다른 동사를 써서(자리군요 → 좁혀둘게요 →
 *  기억해둘게요 → 추려둘게요 → 담았어요) 고를수록 후보가 좁혀지는 느낌을 준다 —
 *  매번 같은 꼴이면 기계적으로 읽힌다. 앞에서 "상관없어요"를 골랐으면 비워 둔다 */
function echoFor(step: number, d: DraftCondition): string | null {
  switch (step) {
    case 0:
      return "청첩장 모임 장소, 같이 골라봐요";
    case 1:
      return d.relationship ? RELATIONSHIP_ECHO[d.relationship] : null;
    case 2: {
      if (!d.people || !d.area) return null;
      const people = PEOPLE_LABEL[d.people];
      return d.area === "all"
        ? `${people} 자리로 좁혀둘게요`
        : `${AREA_LABEL[d.area]} 근처, ${people} 자리로 좁혀둘게요`;
    }
    case 3:
      if (!d.budget) return null;
      // 슬라이더는 "4만원 이하"처럼 정확한 값을 보여주지만 점수는 구간(3만~5만 원)으로 매긴다 —
      // 숫자가 달라 보이지 않게 "~대"를 붙여 구간이라는 걸 드러낸다
      if (d.budget === "any") return "예산보다 자리를 먼저 볼게요";
      {
        const label = BUDGET_LABEL[d.budget];
        const isRange = label.includes("~"); // "2만 원 이하"·"5만 원 이상"엔 "대"가 어색하다
        return `예산은 1인 ${label}${isRange ? "대" : ""}, 기억해둘게요`;
      }
    case 4: {
      const picked = d.cuisines.filter((c) => c !== "any");
      if (picked.length === 0) return null;
      const labels = picked.map((c) => QUESTIONS.cuisines.options.find((o) => o.value === c)?.label ?? c);
      return `${labels.join("·")} 쪽으로 추려둘게요`;
    }
    case 5:
      return d.vibe && d.vibe !== "any" ? `${VIBE_MOOD[d.vibe]}까지 담았어요. 이제 마지막이에요` : null;
    default:
      return null;
  }
}

function canProceed(step: number, d: DraftCondition): boolean {
  switch (step) {
    case 0:
      return Boolean(d.relationship);
    case 1:
      return Boolean(d.people && d.area);
    case 2:
      return Boolean(d.budget);
    case 3:
      return d.cuisines.length > 0;
    case 4:
      return Boolean(d.vibe);
    default:
      return true;
  }
}

function SearchWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
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

  useEffect(() => {
    track("filter_step_viewed", { step_number: step + 1, step_name: STEPS[step].name });
  }, [step]);

  const isLast = step === STEPS.length - 1;
  const echo = echoFor(step, draft);

  function selectSingle(key: SingleKey, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    track("filter_option_selected", { condition_type: key, condition_value: value });
  }

  function toggleMulti(question: MultiQuestion, value: string) {
    setDraft((prev) => ({
      ...prev,
      [question.key]: toggleMultiValue(prev[question.key], question, value),
    }));
    track("filter_option_selected", { condition_type: question.key, condition_value: value });
  }

  function goToResults(condition: Condition) {
    router.push(`/search/loading?${conditionToSearchParams(condition).toString()}`);
  }

  function handleNext() {
    if (!canProceed(step, draft)) return;
    track("filter_step_completed", { step_number: step + 1, step_name: STEPS[step].name, completion_time: Date.now() });
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    const condition = conditionFromDraft(draft);
    if (!condition) return;
    track("filter_submitted", {
      relationship: condition.relationship,
      people: condition.people,
      area: condition.area,
      budget: condition.budget,
      vibe: condition.vibe,
    });
    goToResults(condition);
  }

  function handlePrev() {
    if (step === 0) {
      router.push("/");
      return;
    }
    setStep((s) => s - 1);
  }

  /** 지금까지 답한 건 그대로 쓰고, 나머지는 "상관없음"에 가까운 값으로 채워 바로 결과로 간다.
   *  관계·인원은 그런 값이 없어 각각 "그 밖의 분"/"3~4명"을 중립값으로 둔다 */
  function handleSkip() {
    const condition = conditionFromDraft({
      relationship: draft.relationship ?? "other",
      people: draft.people ?? "3-4",
      area: draft.area ?? "all",
      budget: draft.budget ?? "any",
      cuisines: draft.cuisines.length > 0 ? draft.cuisines : ["any"],
      vibe: draft.vibe ?? "any",
      extraConditions: draft.extraConditions,
    });
    if (!condition) return;
    track("filter_skipped", { step_number: step + 1, step_name: STEPS[step].name });
    goToResults(condition);
  }

  // 예산은 슬라이더가 늘 값을 보여주고 있어 건너뛸 이유가 없고, 마지막 화면은 그 자체가
  // 선택 입력이라 "건너뛰기"를 두지 않는다
  const showSkip = step !== 2 && !isLast;

  return (
    <>
      {/* 상단바: 뒤로가기 · 건너뛰기 + 6칸 진행 표시. 공용 Header를 끄고(Header.tsx 참고)
          프레임 기준 absolute로 그려서 <main>이 스크롤돼도 항상 맨 위에 고정된다 */}
      <div className="absolute inset-x-0 top-0 z-20 bg-cream px-6 pb-3 pt-6">
        <div className="flex h-9 items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            aria-label={step === 0 ? "홈으로 나가기" : "이전 질문"}
            className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-cream-strong active:bg-cream-strong"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          {showSkip && (
            <button type="button" onClick={handleSkip} className="text-label font-medium text-ink-soft hover:text-ink">
              건너뛰기
            </button>
          )}
        </div>
        <div
          className="mt-3 flex gap-1"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-label={`전체 ${STEPS.length}단계 중 ${step + 1}번째`}
        >
          {STEPS.map((s, i) => (
            <span
              key={s.name}
              className={clsx("h-1 flex-1 rounded-full transition-colors duration-300", i <= step ? "bg-accent" : "bg-line-strong")}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6 pb-8">
        <div className="flex flex-col">
          {/* 머리말은 청모픽이 말을 건네는 작은 말풍선이다. 더 중요한 건 아래 질문 제목이라
              말풍선은 작게 두고, 브랜드색은 안쪽 반짝임 아이콘에만 쓴다. 회색 바닥(cream) 위
              흰 말풍선은 그대로면 경계가 거의 안 보여서 옅은 테두리와 그림자로 살짝 띄운다 */}
          {echo && (
            <p
              key={`${step}-${echo}`}
              className="animate-fade-in-up mb-3.5 inline-flex items-center gap-1.5 self-start rounded-[4px_12px_12px_12px] border border-line-strong/70 bg-cream-soft py-1.5 pl-2.5 pr-3 text-caption font-medium text-ink/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            >
              <Sparkle className="h-3 w-3 shrink-0 text-accent" fill="currentColor" strokeWidth={1.5} aria-hidden />
              {/* 청모픽이 실제로 답을 쓰는 것처럼 한 글자씩 찍는다 */}
              <TypingText text={echo} />
            </p>
          )}
          <h1 className="text-h1 font-bold text-ink text-balance">{STEPS[step].title}</h1>
          {STEPS[step].help && <p className="mt-1.5 text-caption text-ink-soft">{STEPS[step].help}</p>}
        </div>

        {step === 0 && (
          <div className="grid grid-cols-2 gap-2">
            {QUESTIONS.relationship.options.map((o) => (
              <Chip
                key={o.value}
                block
                selected={draft.relationship === o.value}
                onClick={() => selectSingle("relationship", o.value)}
              >
                {o.label}
              </Chip>
            ))}
          </div>
        )}

        {step === 1 && (
          <>
            <Section label="인원">
              <div className="flex flex-wrap gap-2">
                {QUESTIONS.people.options.map((o) => (
                  <Chip key={o.value} selected={draft.people === o.value} onClick={() => selectSingle("people", o.value)}>
                    {o.label}
                  </Chip>
                ))}
              </div>
            </Section>
            <Section label="지역">
              <div className="flex flex-col gap-2">
                {QUESTIONS.area.options.map((o) => {
                  const selected = draft.area === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectSingle("area", o.value)}
                      className={clsx(
                        "flex items-baseline gap-2 rounded-md border px-3.5 py-3 text-left transition",
                        selected ? "border-accent bg-accent-soft" : "border-line bg-cream-soft hover:border-line-strong",
                      )}
                    >
                      <span className={clsx("text-body font-bold", selected ? "text-accent-strong" : "text-ink")}>{o.label}</span>
                      {o.hint && <span className="text-micro text-ink-soft">{o.hint}</span>}
                    </button>
                  );
                })}
              </div>
            </Section>
          </>
        )}

        {step === 2 && <BudgetSlider value={draft.budget} onChange={(value) => selectSingle("budget", value)} />}

        {step === 3 && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {QUESTIONS.cuisines.options
                .filter((o) => o.value !== "any")
                .map((o) => (
                  <PhotoTile
                    key={o.value}
                    label={o.label}
                    photo={cuisinePhoto(o.value as CuisineKey)!}
                    alt={`${o.label} 음식 사진`}
                    selected={draft.cuisines.includes(o.value)}
                    onClick={() => toggleMulti(QUESTIONS.cuisines, o.value)}
                  />
                ))}
            </div>
            <AnyOption
              label="메뉴는 상관없어요"
              selected={draft.cuisines.includes("any")}
              onClick={() => toggleMulti(QUESTIONS.cuisines, "any")}
            />
          </>
        )}

        {step === 4 && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {QUESTIONS.vibe.options
                .filter((o) => o.value !== "any")
                .map((o) => (
                  <PhotoTile
                    key={o.value}
                    label={o.label}
                    hint={o.hint}
                    photo={vibePhoto(o.value as VibeKey)!}
                    alt={`${o.label} 예시 공간 사진`}
                    selected={draft.vibe === o.value}
                    onClick={() => selectSingle("vibe", o.value)}
                  />
                ))}
            </div>
            <AnyOption label={VIBE_LABEL.any} selected={draft.vibe === "any"} onClick={() => selectSingle("vibe", "any")} />
          </>
        )}

        {step === 5 && (
          <div className="flex flex-wrap gap-2">
            {QUESTIONS.extraConditions.options.map((o) => (
              <Chip
                key={o.value}
                selected={draft.extraConditions.includes(o.value)}
                onClick={() => toggleMulti(QUESTIONS.extraConditions, o.value)}
              >
                {o.label}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <StickyBottomBar>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed(step, draft)}
          className="flex w-full items-center justify-center rounded-lg bg-accent py-3.5 text-button font-bold text-white transition-all hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:bg-cream-strong disabled:text-ink-faintest disabled:hover:brightness-100"
        >
          {isLast ? "내 조건에 맞는 곳 보기" : "다음"}
        </button>
      </StickyBottomBar>
    </>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-caption font-bold text-ink-soft">{label}</p>
      {children}
    </div>
  );
}

/** 한 개 고르는 질문은 2열 칸(block), 여러 개 고르거나 짧은 값은 줄바꿈되는 칩 */
function Chip({
  selected,
  onClick,
  block = false,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  block?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={clsx(
        "border text-body transition",
        // 모든 선택 버튼은 같은 모서리(rounded-md)를 쓴다 — 한 칸짜리든 줄바꿈 칩이든 크기만 다르다
        block ? "rounded-md px-3 py-3.5 text-center" : "rounded-md px-4 py-2.5",
        selected
          ? "border-accent bg-accent-soft font-bold text-accent-strong"
          : "border-line bg-cream-soft font-medium text-ink hover:border-line-strong",
      )}
    >
      {children}
    </button>
  );
}

/** 사진 카드: 모두 같은 크기(정사각형). 선택하면 브랜드색 테두리 + 체크 */
function PhotoTile({
  label,
  hint,
  photo,
  alt,
  selected,
  onClick,
}: {
  label: string;
  hint?: string;
  photo: string;
  alt: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="relative isolate aspect-square overflow-hidden rounded-md bg-cream-strong text-left"
    >
      <Image src={photo} alt={alt} fill sizes="(max-width: 430px) 50vw, 200px" className="object-cover" />
      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/0" aria-hidden />
      <span className="absolute bottom-2.5 left-3 right-3 flex flex-col gap-0.5 text-white">
        <span className="text-label font-bold">{label}</span>
        {hint && <span className="text-micro text-white/85">{hint}</span>}
      </span>
      <span
        aria-hidden
        className={clsx(
          "absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2",
          selected ? "border-accent bg-accent text-white" : "border-white/90 bg-black/20",
        )}
      >
        {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      {selected && <span aria-hidden className="pointer-events-none absolute inset-0 rounded-md border-[3px] border-accent" />}
    </button>
  );
}

/** "상관없어요"는 사진 카드 중 하나가 아니라 "고르지 않는" 선택이라, 그리드 밖 아래에 구분선과
 *  함께 전체 폭 한 줄로 따로 둔다 — 사진 카드와 같은 모양이면 또 하나의 메뉴·분위기처럼 읽힌다 */
function AnyOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <div className="flex flex-col gap-3 border-t border-line-strong pt-4">
      <p className="text-caption text-ink-soft">딱히 정한 게 없다면</p>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onClick}
        className={clsx(
          "flex items-center justify-between rounded-md border px-4 py-3.5 text-left text-body transition",
          selected ? "border-accent bg-accent-soft font-bold text-accent-strong" : "border-line bg-cream-soft font-medium text-ink hover:border-line-strong",
        )}
      >
        {label}
        <span
          aria-hidden
          className={clsx(
            "flex h-5 w-5 items-center justify-center rounded-full border-2",
            selected ? "border-accent bg-accent text-white" : "border-line-strong",
          )}
        >
          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
        </span>
      </button>
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
