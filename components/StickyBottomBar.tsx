import type { ReactNode } from "react";
import { clsx } from "clsx";

/**
 * 화면 하단에 고정되는 단일 CTA 바.
 * 토스·당근마켓류 국내 모바일 서비스의 "엄지 손가락 반경 안에 항상 있는 기본 액션" 패턴을 따른다 —
 * 스크롤 위치와 무관하게 항상 같은 자리에서 누를 수 있어야 한다.
 */
export function StickyBottomBar({
  children,
  tone = "surface",
}: {
  children: ReactNode;
  /** surface: 흰 바닥 + 위 헤어라인(상세처럼 본문이 흰 화면). page: 본문과 같은 회색 바닥으로
   *  이어 붙인다(조건 입력처럼 본문이 회색인 화면 — 버튼 영역만 흰색이면 따로 떠 보인다) */
  tone?: "surface" | "page";
}) {
  return (
    // 원티드는 glassy 효과(blur backdrop)를 명시적으로 금지한다 — 완전 불투명한 표면 +
    // 헤어라인 보더로만 아래 콘텐츠와 분리한다
    <div
      className={clsx(
        "absolute inset-x-0 bottom-0 z-20",
        tone === "surface" ? "border-t border-line bg-cream-soft" : "bg-cream",
      )}
    >
      {/* 회색 바닥끼리는 선이 없으니, 스크롤되는 내용이 버튼 뒤로 뚝 잘리지 않게 위쪽에 짧은 페이드를 둔다 */}
      {tone === "page" && (
        <div className="pointer-events-none absolute inset-x-0 -top-3 h-3 bg-gradient-to-b from-transparent to-cream/80" aria-hidden />
      )}
      <div
        className="mx-auto max-w-xl px-6 pt-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        {children}
      </div>
    </div>
  );
}
