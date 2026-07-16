import type { ReactNode } from "react";

/**
 * 화면 하단에 고정되는 단일 CTA 바.
 * 토스·당근마켓류 국내 모바일 서비스의 "엄지 손가락 반경 안에 항상 있는 기본 액션" 패턴을 따른다 —
 * 스크롤 위치와 무관하게 항상 같은 자리에서 누를 수 있어야 한다.
 */
export function StickyBottomBar({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 border-t border-line bg-cream-soft/95 backdrop-blur">
      <div
        className="mx-auto max-w-xl px-6 pt-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        {children}
      </div>
    </div>
  );
}
