"use client";

import { usePathname } from "next/navigation";
import { clsx } from "clsx";

/**
 * 대부분의 화면은 세로로 스크롤되는 카드 목록이라 main에 여백·스크롤을 공통으로 깔아둔다.
 * 다만 지도 탭은 레퍼런스처럼 지도가 화면을 꽉 채워야 해서, 그 화면만 여백·스크롤을 없애고
 * 지도 컴포넌트가 남은 공간 전체를 직접 채우도록 비워준다.
 * 조건입력 위저드는 공용 Header 대신 자체 상단바(뒤로가기·현재 단계·건너뛰기)를 프레임
 * 기준 absolute로 그리므로(BottomNav와 같은 방식), 그 아래 콘텐츠가 가리지 않도록
 * 위쪽 여백을 그 상단바 높이만큼 더 확보해둔다.
 * 결과 목록(/results)은 BottomNav를 숨기기로 했고 자체 하단 고정바도 없어서, 다른
 * 화면들처럼 BottomNav 높이만큼의 여백(pb-32)을 미리 깔아둘 이유가 없다.
 */
export function MainArea({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullBleedMap = pathname.startsWith("/map");
  const isSearchWizard = pathname.startsWith("/search");
  const isResults = pathname.startsWith("/results");

  return (
    <main
      className={clsx(
        "flex-1",
        isFullBleedMap
          ? "relative overflow-hidden"
          : clsx(
              "scrollbar-hide overflow-y-auto px-6",
              isSearchWizard ? "pt-[120px]" : "pt-8",
              isResults ? "pb-8" : "pb-32",
            ),
      )}
    >
      {children}
    </main>
  );
}
