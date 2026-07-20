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
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** 스크롤 영역 안에 sticky로 넣지 않고 별도 슬롯으로 받는다 — sticky는 그 안에 실제로
   *  스크롤할 내용이 있을 때만 "붙는" 것처럼 보이고, 내용이 짧아 스크롤이 필요 없으면
   *  그냥 콘텐츠 뒤에 나란히 배치돼버려 아래에 빈 공간이 남는다. 시트 높이를 고정값(h-[90%])
   *  으로 바꾸면서 실제로 이 문제가 발생했다 — 항상 바닥에 고정돼야 하는 요소는 애초에
   *  스크롤 컨테이너 밖, flex column의 별도 형제로 둬야 내용 길이와 무관하게 항상 맨 아래에 있다 */
  footer?: ReactNode;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // onClose를 effect 의존성에 직접 넣으면, 시트 안에서 옵션을 하나 고를 때마다(부모의
  // draft state가 바뀌어 리렌더될 때마다) onClose가 새 함수 참조로 바뀌어 이 effect가
  // 매번 다시 실행됐다 — 그때마다 panelRef.current?.focus()가 다시 불려서 방금 누른
  // 옵션 버튼에서 포커스를 도로 빼앗아갔다. 이게 "옵션을 누르면 인터랙션이 이상해진다"의
  // 원인이었다. ref로 최신 콜백만 들고 있고, effect 자체는 mounted가 바뀔 때만 돈다.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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
    // 다이얼로그가 열리면 포커스를 패널 안으로 옮겨, 배경 뒤 콘텐츠가 탭 순서에 남지 않게 한다.
    // (시트가 열릴 때 딱 한 번만 — mounted가 바뀔 때만 이 effect가 돈다)
    panelRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      if (scrollEl) scrollEl.style.overflow = prevOverflow ?? "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted]);

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
        // "화면(프레임)의 N%"가 실제 프레임 기준으로 정확히 계산된다. min-h와 max-h를
        // 같은 값으로 둬서 내용 길이와 무관하게 항상 이 비율만큼 차게 한다(뒤로 보이는
        // 딤드 영역을 더 줄여달라는 요청 — max-h만 두면 내용이 짧을 때 그보다 작게 뜬다)
        className={`absolute inset-x-0 bottom-0 mx-auto flex h-[90%] w-full max-w-xl flex-col rounded-t-xl bg-cream-soft shadow-sheet outline-none transition-transform duration-220 ease-out motion-reduce:transition-none ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-center pt-2.5">
          <div className="h-1 w-9 rounded-full bg-line-strong" />
        </div>
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-line px-5 pb-3 pt-2">
            <p id={titleId} className="text-lg font-bold text-ink">
              {title}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-cream-strong"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
        {footer && (
          <div
            className="shrink-0 border-t border-line bg-cream-soft px-5 pt-3"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
