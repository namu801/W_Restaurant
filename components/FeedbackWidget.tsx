"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { track } from "@/lib/analytics";
import type { FeedbackValue } from "@/lib/types";

const DETAIL_OPTIONS: Record<FeedbackValue, string[]> = {
  helpful: [
    "조건에 잘 맞는 후보를 추려줘서",
    "추천 이유와 아쉬운 점이 구체적이어서",
    "비교·예약에 필요한 정보를 한눈에 볼 수 있어서",
  ],
  not_helpful: [
    "추천 장소가 내 조건과 잘 맞지 않아서",
    "추천 이유가 충분히 납득되지 않아서",
    "비교·예약에 필요한 정보가 부족해서",
  ],
};

export function FeedbackWidget({ placeId }: { placeId: string }) {
  const [value, setValue] = useState<FeedbackValue | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // "제출됨" 이벤트는 실제로 다 끝났을 때(구체적인 이유까지 골랐을 때) 딱 한 번만 쏜다.
  // 도움/아쉬움 버튼을 누른 시점에도 같이 쐈더니, 세부 이유를 고르기 전에 페이지를 벗어난
  // 경우까지 "제출 완료"로 집계돼 지표가 부풀려졌다
  function selectValue(v: FeedbackValue) {
    setValue(v);
  }

  // 이유 칩을 고르면 그걸로 바로 확정한다 — 별도 "제출" 버튼을 더 두면 한 단계가 늘어나
  // 끝까지 안 누르고 이탈할 여지가 생긴다
  function selectDetail(detail: string) {
    track("recommendation_feedback_submitted", { place_id: placeId, feedback_value: value, detail });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-sage/25 bg-sage-soft px-4 py-5 text-center">
        <p className="text-2xl">🎉</p>
        <p className="mt-1.5 text-sm font-bold text-sage">소중한 의견 감사해요!</p>
        <p className="mt-0.5 text-xs text-sage/80">다음 추천에 꼭 참고할게요</p>
      </div>
    );
  }

  if (value) {
    const isHelpful = value === "helpful";
    return (
      <div className="rounded-lg border border-line bg-cream-soft p-5">
        <p className="text-center text-[15px] font-bold text-ink">
          {isHelpful ? "가장 도움이 된 점은 무엇인가요?" : "가장 아쉬웠던 점은 무엇인가요?"}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {DETAIL_OPTIONS[value].map((detail) => (
            <button
              key={detail}
              type="button"
              onClick={() => selectDetail(detail)}
              className={clsx(
                "rounded-lg border-2 border-line bg-white px-4 py-3 text-left text-sm font-semibold text-ink-soft transition-all active:scale-[0.98]",
                isHelpful
                  ? "hover:border-sage hover:bg-sage-soft hover:text-sage"
                  : "hover:border-clay hover:bg-clay-soft hover:text-clay",
              )}
            >
              {detail}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 참여율을 높이고 싶어서 딱딱한 텍스트 버튼 대신, 이모지+큰 터치 영역의 카드 두 개로
  // 바꿨다. 살짝 눌리는 tap 반응(active:scale)만 더해 "눌러보고 싶은" 느낌을 준다 —
  // 이 서비스의 다른 곳엔 없는 동작이지만, 참여를 유도해야 하는 이 자리만의 예외로 둔다
  return (
    <div className="rounded-lg border border-line bg-cream-soft p-5 text-center">
      <p className="text-[15px] font-bold text-ink">이 추천, 도움이 되었나요?</p>
      <p className="mt-1 text-xs text-ink-soft">한마디만 남겨주시면 다음 추천이 더 좋아져요</p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => selectValue("helpful")}
          className="flex flex-1 flex-col items-center gap-1.5 rounded-lg border-2 border-line bg-white py-4 transition-all hover:border-sage hover:bg-sage-soft active:scale-[0.97]"
        >
          <span className="text-2xl" aria-hidden>
            😊
          </span>
          <span className="text-sm font-bold text-ink-soft">도움됐어요</span>
        </button>
        <button
          type="button"
          onClick={() => selectValue("not_helpful")}
          className="flex flex-1 flex-col items-center gap-1.5 rounded-lg border-2 border-line bg-white py-4 transition-all hover:border-clay hover:bg-clay-soft active:scale-[0.97]"
        >
          <span className="text-2xl" aria-hidden>
            🤔
          </span>
          <span className="text-sm font-bold text-ink-soft">아쉬워요</span>
        </button>
      </div>
    </div>
  );
}
