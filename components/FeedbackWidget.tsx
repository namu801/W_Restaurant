"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { track } from "@/lib/analytics";
import type { FeedbackValue } from "@/lib/types";

export function FeedbackWidget({ placeId }: { placeId: string }) {
  const [submitted, setSubmitted] = useState<FeedbackValue | null>(null);

  function submit(value: FeedbackValue) {
    setSubmitted(value);
    track("recommendation_feedback_submitted", {
      place_id: placeId,
      feedback_value: value,
    });
  }

  if (submitted) {
    return (
      <p className="rounded-full bg-sage-soft px-4 py-3 text-center text-sm text-sage">
        소중한 의견 감사해요. 다음 추천에 참고할게요.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink">이 추천이 도움이 되었나요?</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => submit("helpful")}
          className={clsx(
            "flex-1 rounded-full border border-line bg-cream-soft px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-sage hover:text-sage active:bg-sage-soft",
          )}
        >
          도움이 되었어요
        </button>
        <button
          type="button"
          onClick={() => submit("not_helpful")}
          className={clsx(
            "flex-1 rounded-full border border-line bg-cream-soft px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-clay hover:text-clay active:bg-clay-soft",
          )}
        >
          아쉬워요
        </button>
      </div>
    </div>
  );
}
