import type { ReactNode } from "react";

/**
 * 화면 하단에 고정되는 단일 CTA 바.
 * 토스·당근마켓류 국내 모바일 서비스의 "엄지 손가락 반경 안에 항상 있는 기본 액션" 패턴을 따른다 —
 * 스크롤 위치와 무관하게 항상 같은 자리에서 누를 수 있어야 한다.
 */
export function StickyBottomBar({ children }: { children: ReactNode }) {
  return (
    // 원티드는 glassy 효과(blur backdrop)를 명시적으로 금지한다 — 완전 불투명한 표면 +
    // 헤어라인 보더로만 아래 콘텐츠와 분리한다
    <div className="absolute inset-x-0 bottom-0 z-20 border-t border-line bg-cream-soft">
      <div
        className="mx-auto max-w-xl px-6 pt-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        {children}
      </div>
    </div>
  );
}
