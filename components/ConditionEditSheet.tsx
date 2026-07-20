"use client";

import { Check, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useRef, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { BudgetSlider } from "@/components/BudgetSlider";
import { conditionToSearchParams } from "@/lib/condition-query";
import { track } from "@/lib/analytics";
import {
  SCREENS,
  emptyDraft,
  draftFromCondition,
  isDraftComplete,
  toggleMultiValue,
  type DraftCondition,
  type MultiQuestion,
  type Question,
  type SingleKey,
} from "@/lib/wizard-questions";
import type { Condition } from "@/lib/types";

/** 위저드의 질문 title은 "누구에게 청첩장을 전달하나요?" 같은 완결된 문장이라 스텝
 *  화면에서는 맞지만, 필터 시트처럼 한 화면에 8개 질문이 다 나열될 때는 너무 길다.
 *  이 화면 전용으로 짧은 명사형 라벨만 따로 둔다 */
const SHEET_LABEL: Record<Question["key"], string> = {
  relationship: "관계",
  people: "인원",
  area: "지역",
  budget: "예산",
  cuisines: "음식",
  noise: "소음",
  moodFormality: "분위기",
  extraConditions: "추가 조건",
};

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

  // 레퍼런스(네이버쇼핑 필터)처럼 전부 비운 상태로 되돌린다 — 열기 전 조건으로 되돌리는
  // "취소"가 아니라, 새로 고르게 하는 "초기화"다
  function handleReset() {
    setDraft(emptyDraft());
  }

  const canApply = isDraftComplete(draft);

  return (
    <>
      {/* 흰 배경+테두리로 강조하던 걸 걷어냈다 — 그 강조를 큐레이션 배지 쪽으로 몰아주고,
          여기는 옆의 "추천순" 드롭다운과 완전히 같은 방식(아이콘+텍스트, 배경·테두리 없음)
          으로 맞췄다. 둘 다 이 줄의 보조 컨트롤이라 같은 무게로 읽혀야 한다 */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        필터
      </button>

      <BottomSheet
        open={open}
        onClose={handleClose}
        title="필터"
        footer={
          // 스크롤 영역 안에 sticky로 넣었더니, 시트를 고정 높이(h-[90%])로 바꾼 뒤로
          // 내용이 그 높이를 다 안 채울 때 버튼이 콘텐츠 바로 뒤에 붙어버리고 그 아래로
          // 빈 회색 공간이 남는 오류가 있었다. BottomSheet의 별도 footer 슬롯으로 옮겨서
          // 스크롤 상태와 무관하게 항상 시트 맨 아래에 고정되게 했다
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              className="shrink-0 rounded-lg border border-line px-5 py-3.5 text-[15px] font-bold text-ink-soft transition-colors hover:bg-cream-strong"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!canApply}
              className="flex-1 rounded-lg bg-accent py-3.5 text-[15px] font-bold text-white transition-all hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
            >
              적용하기
            </button>
          </div>
        }
      >
        {/* 레퍼런스(차량 필터·구독 서비스 필터) 두 개를 합쳤다 —
            1) "모임 정보/식사 조건" 같은 단계 제목은 없애고, 질문(관계/인원/지역/예산...)을
               모두 한 줄로 펼친 뒤 divide-y로 사이사이 옅은 헤어라인만 넣는다. 레퍼런스가
               "필터" 제목 아래, 그리고 각 섹션 사이에 두는 얇고 연한 구분선과 같은 방식이다.
            2) 칩은 pill이 아니라 버튼과 같은 radius(rounded-lg)를 쓰고, 카테고리 아이콘은
               모두 빼고, 선택된 칩에만 좌측에 체크 아이콘을 붙인다(레퍼런스의 "일주일/1개월"
               칩 패턴). 선택-비선택 대비를 위해 선택은 두꺼운 보더(border-2)+진한 텍스트,
               비선택은 얇은 보더+옅은 텍스트(text-ink-soft)로 갈랐다. */}
        <div className="flex flex-col divide-y divide-line">
          {SCREENS.map(({ question }) => (
            <div key={question.key} className="flex flex-col gap-3 py-5 first:pt-4">
              <p className="text-lg font-bold text-ink">{SHEET_LABEL[question.key]}</p>
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
                          "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3.5 py-2 text-left transition",
                          selected
                            ? "border-2 border-accent bg-accent-soft"
                            : "border border-line bg-white hover:border-line-strong active:bg-cream-strong",
                        )}
                      >
                        {selected && <Check className="h-4 w-4 shrink-0 text-accent" strokeWidth={2.5} />}
                        <span
                          className={clsx(
                            "whitespace-nowrap text-sm font-semibold leading-snug",
                            selected ? "text-accent" : "text-ink-soft",
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
      </BottomSheet>
    </>
  );
}
