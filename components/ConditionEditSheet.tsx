"use client";

import { SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useRef, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { OptionBadge } from "@/components/OptionBadge";
import { BudgetSlider } from "@/components/BudgetSlider";
import { conditionToSearchParams } from "@/lib/condition-query";
import { track } from "@/lib/analytics";
import {
  STAGES,
  draftFromCondition,
  isDraftComplete,
  toggleMultiValue,
  type DraftCondition,
  type MultiQuestion,
  type SingleKey,
} from "@/lib/wizard-questions";
import type { Condition } from "@/lib/types";

/**
 * 결과·상세 화면에서 조건을 스텝 위저드 처음부터 다시 밟지 않고,
 * 바텀시트 하나에서 모든 질문을 한눈에 보고 고쳐서 바로 재검색할 수 있게 한다.
 */
export function ConditionEditSheet({
  condition,
  resultCount,
}: {
  condition: Condition;
  /** 결과 개수를 알 수 있는 화면(결과 목록)에서만 넘긴다. 상세 화면처럼 알 수 없는 곳에서는 생략한다 */
  resultCount?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DraftCondition>(() => draftFromCondition(condition));
  const triggerRef = useRef<HTMLButtonElement>(null);

  function handleOpen() {
    setDraft(draftFromCondition(condition)); // 열 때마다 화면에 반영된 최신 조건으로 맞춘다
    setOpen(true);
    track("filter_edited", {
      condition_type: "sheet_opened",
      ...(resultCount !== undefined && { current_result_count: resultCount }),
    });
  }

  function handleClose() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function selectSingle(key: SingleKey, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function toggleMulti(question: MultiQuestion, value: string) {
    setDraft((prev) => ({
      ...prev,
      [question.key]: toggleMultiValue((prev[question.key] as string[]) ?? [], question, value),
    }));
  }

  function handleApply() {
    if (!isDraftComplete(draft)) return;
    setOpen(false);
    router.push(`/results?${conditionToSearchParams(draft).toString()}`);
  }

  const canApply = isDraftComplete(draft);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-3 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink-faint active:bg-cream-strong"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        조건 수정
      </button>

      <BottomSheet open={open} onClose={handleClose} title="조건 한눈에 수정하기">
        {/* 시트 제목(18px 세리프) > 단계 제목(16px) > 질문 제목(14px, 옅은 톤) > 선택지(12px)
            순으로 크기·색을 단계적으로 낮춰서 위계를 분명히 한다. 단계 제목엔 밑줄을 둬서
            "여기서부터 새 그룹"이라는 걸 여백만으로 짐작하지 않아도 되게 한다 */}
        <div className="flex flex-col gap-8 pb-2">
          {STAGES.map((stage) => (
            <section key={stage.name} className="flex flex-col gap-4">
              <h2 className="border-b border-line pb-2 text-base font-bold text-ink">{stage.name}</h2>
              <div className="flex flex-col gap-5">
                {stage.questions.map((question) => (
                  <div key={question.key} className="flex flex-col gap-2">
                    <p className="text-sm font-semibold text-ink-soft">{question.title}</p>
                    {question.key === "budget" ? (
                      <BudgetSlider
                        value={draft.budget}
                        onChange={(value) => selectSingle("budget", value)}
                      />
                    ) : (
                      // 레퍼런스(필터 바텀시트)처럼 고정폭 그리드 대신 내용 크기대로 흘러가는 칩으로
                      // 바꿔서 간격을 좁히고 더 조밀하게 훑어볼 수 있게 했다
                      <div className="flex flex-wrap gap-2">
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
                                isMulti
                                  ? toggleMulti(question, option.value)
                                  : selectSingle(question.key, option.value)
                              }
                              className={clsx(
                                "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-left transition active:scale-[0.98]",
                                selected
                                  ? "border-accent bg-accent-soft"
                                  : "border-line bg-white hover:border-line-strong active:bg-cream-strong",
                              )}
                            >
                              {/* 아이콘이 이제 배경 없이 색으로만 앉기 때문에 카드 배경과 겹쳐 사라질 일이 없다.
                                  아이콘이 애매한 질문(인원 등)은 OptionBadge가 알아서 아무것도 그리지 않는다 */}
                              <OptionBadge question={question} option={option} size="sm" />
                              <span
                                className={clsx(
                                  "whitespace-nowrap text-xs font-semibold leading-snug",
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
                  </div>
                ))}
              </div>
            </section>
          ))}

          <div className="sticky bottom-0 -mx-5 border-t border-line bg-cream-soft px-5 pt-3">
            <button
              type="button"
              onClick={handleApply}
              disabled={!canApply}
              className="w-full rounded-lg bg-accent py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-accent-strong active:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
              style={{ marginBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
            >
              이 조건으로 다시 찾기
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
