"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { TrackOnMount } from "@/components/TrackOnMount";

/**
 * 백엔드·DB 없이 동작하는 앱이라, 의견은 이미 쓰고 있는 분석 이벤트(Mixpanel)로 보낸다.
 * 나중에 Mixpanel 이벤트 뷰에서 general_feedback_submitted를 모아서 확인할 수 있다.
 */
export default function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!message.trim()) return;
    track("general_feedback_submitted", { message: message.trim() });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-lg font-bold text-ink">의견 잘 받았어요.</p>
        <p className="text-sm text-ink-soft">더 나은 청모픽을 만드는 데 참고할게요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <TrackOnMount event="feedback_page_viewed" />

      <div>
        <h1 className="text-xl font-bold leading-snug tracking-tight text-ink text-balance">
          청모픽에 대한 의견을 작성해주세요
        </h1>
        <p className="mt-2 text-sm text-ink-soft">불편했던 점, 있었으면 하는 기능 뭐든 편하게 남겨주세요.</p>
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="여기에 의견을 적어주세요"
        rows={8}
        className="w-full resize-none rounded-md border border-line bg-cream-soft p-4 text-sm text-ink placeholder:text-ink-faintest"
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!message.trim()}
        className="w-full rounded-lg bg-accent py-3.5 text-[15px] font-bold text-white transition-all hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
      >
        의견 보내기
      </button>

      {/* 동의 팝업 없이, 굳이 안 눌러도 되는 조용한 고지 한 줄만 남긴다 — 개인정보를 별도로
          요청하지 않는 포트폴리오 프로젝트라 배너 형태의 동의 절차까지는 필요 없지만,
          분석 도구를 쓰고 있다는 사실 자체는 투명하게 밝혀둔다 */}
      <p className="text-xs text-ink-faint">
        서비스 개선을 위해 이용 화면·클릭 데이터를 분석 도구(Mixpanel 등)로 수집하고 있어요.
      </p>
    </div>
  );
}
