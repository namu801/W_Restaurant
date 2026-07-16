"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

const STORAGE_KEY = "cheongcheobjari:onboarding_seen";

/**
 * 처음 들어온 방문자에게만 뜨는 서비스 소개 팝업. 기프·카카오맵·토스 같은 앱들이
 * 첫 진입 시 화면을 딤 처리하고 짧은 환영 모달을 띄우는 패턴을 참고했다.
 * localStorage에 한 번 봤다는 표시를 남겨서 다음 방문부터는 뜨지 않는다.
 */
export function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const startButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setVisible(true);
      track("onboarding_viewed");
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    startButtonRef.current?.focus();
    // 배경이 딤 처리돼 있어도 main의 스크롤은 잠기지 않아, 모달 바깥 영역을 드래그하면
    // 뒤쪽 홈 콘텐츠가 그대로 스크롤된다. 열려 있는 동안은 main을 잠근다
    const scrollEl = document.querySelector("main");
    const prevOverflow = scrollEl?.style.overflow;
    if (scrollEl) scrollEl.style.overflow = "hidden";
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleStart();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      if (scrollEl) scrollEl.style.overflow = prevOverflow ?? "";
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function handleStart() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    track("onboarding_completed");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-ink/55 px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-xs rounded-xl bg-cream-soft p-6 text-center shadow-card">
        <span
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-4xl"
          aria-hidden
        >
          💌
        </span>
        <h2 id="onboarding-title" className="mt-4 font-serif text-lg font-bold leading-snug text-ink">
          청모픽에 오신 걸 환영해요
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          관계와 분위기에 맞는 청첩장 모임 장소를 찾아드려요.
          <br />
          조건만 골라주시면 어울리는 곳을 추천해드릴게요.
        </p>
        <button
          ref={startButtonRef}
          type="button"
          onClick={handleStart}
          className="mt-5 w-full rounded-full bg-accent-strong py-3 text-sm font-bold text-white transition-colors hover:bg-accent active:bg-accent"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}
