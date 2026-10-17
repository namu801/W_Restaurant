"use client";

import { useEffect, useState } from "react";

/** 한 글자가 찍히는 간격. 18자 안팎의 머리말이 0.6~0.8초 안에 다 나오도록 맞췄다 —
 *  더 느리면 다음 질문을 읽기 전에 기다리게 되고, 더 빠르면 타이핑처럼 안 보인다 */
const CHAR_INTERVAL_MS = 38;
/** 말풍선이 떠오르는(fade-in-up) 동안은 기다렸다가 찍기 시작한다 */
const START_DELAY_MS = 180;

/**
 * 청모픽이 실제로 답을 쓰는 것처럼 글자를 하나씩 찍는다.
 * - 처음부터 완성된 문장을 투명하게 깔아 자리를 잡아둬서, 찍히는 동안 말풍선 폭이 늘어나며
 *   덜컹거리지 않는다.
 * - 스크린리더에는 한 글자씩이 아니라 완성된 문장을 한 번에 읽힌다.
 * - "동작 줄이기"를 켠 사용자에게는 애니메이션 없이 바로 전체 문장을 보여준다.
 * 같은 컴포넌트에 다른 text가 들어오면 처음부터 다시 찍는다(호출하는 쪽에서 key로 갈아끼워도 된다).
 */
export function TypingText({ text }: { text: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chars = Array.from(text); // 이모지·결합 문자도 한 글자로 센다
    if (reduce) {
      setCount(chars.length);
      return;
    }
    setCount(0);
    let tick: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      tick = setInterval(() => {
        setCount((c) => {
          if (c + 1 >= chars.length && tick) clearInterval(tick);
          return Math.min(c + 1, chars.length);
        });
      }, CHAR_INTERVAL_MS);
    }, START_DELAY_MS);
    return () => {
      clearTimeout(start);
      if (tick) clearInterval(tick);
    };
  }, [text]);

  const chars = Array.from(text);
  const typing = count < chars.length;

  return (
    <span className="relative inline-block">
      <span className="sr-only">{text}</span>
      {/* 완성된 문장으로 자리를 잡아두는 투명한 층 */}
      <span aria-hidden className="invisible">
        {text}
      </span>
      <span aria-hidden className="absolute inset-0 whitespace-nowrap">
        {chars.slice(0, count).join("")}
        {typing && <span className="animate-caret ml-px inline-block h-[1em] w-px translate-y-[0.15em] bg-current" />}
      </span>
    </span>
  );
}
