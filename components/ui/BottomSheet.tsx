"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/**
 * 국내 커머스 앱의 필터/옵션 바텀시트를 참고한 범용 바텀시트.
 * 배경 스크림 + 상단 라운드 패널 + 드래그 핸들. 열려 있는 동안 배경 스크롤을 잠근다.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      setVisible(false);
      const timeout = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(timeout);
    }
    setMounted(true);
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    // 실제로 스크롤되는 요소는 body가 아니라 프레임 안의 main이라, body만 잠그면
    // 시트가 열려 있어도 뒤의 목록이 계속 스크롤된다. main을 직접 잠근다
    const scrollEl = document.querySelector("main");
    const prevOverflow = scrollEl?.style.overflow;
    if (scrollEl) scrollEl.style.overflow = "hidden";
    // 다이얼로그가 열리면 포커스를 패널 안으로 옮겨, 배경 뒤 콘텐츠가 탭 순서에 남지 않게 한다
    panelRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      if (scrollEl) scrollEl.style.overflow = prevOverflow ?? "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-30 motion-reduce:transition-none">
      <div
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-200 motion-reduce:transition-none ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        // 바깥 wrapper가 absolute inset-0로 프레임 높이에 정확히 묶여 있어, vh 대신 %를 쓰면
        // "화면(프레임)의 80%"가 실제 프레임 기준으로 정확히 계산된다
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-h-[80%] w-full max-w-xl flex-col rounded-t-xl bg-cream-soft shadow-card outline-none transition-transform duration-220 ease-out motion-reduce:transition-none ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-center pt-2.5">
          <div className="h-1 w-9 rounded-full bg-line-strong" />
        </div>
        {title && (
          <div className="flex shrink-0 items-center justify-between px-5 pb-1 pt-2">
            <p id={titleId} className="font-serif text-lg font-bold text-ink">
              {title}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-cream-strong"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
