"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { HomeIcon, MapPinIcon, BookmarkIcon } from "@heroicons/react/24/solid";

const ITEMS = [
  { href: "/", label: "홈", icon: HomeIcon, match: (p: string) => p === "/" },
  {
    href: "/map",
    label: "지도",
    icon: MapPinIcon,
    match: (p: string) => p.startsWith("/map"),
  },
  {
    href: "/bookmarks",
    label: "북마크",
    icon: BookmarkIcon,
    match: (p: string) => p.startsWith("/bookmarks"),
  },
] as const;

/**
 * 홈/결과/북마크함 등에서 보이는 하단 탭. 국내 모빌리티 앱 레퍼런스를 따라 떠 있는
 * 캡슐 독 대신 화면 폭 전체를 쓰는 납작한 바로 바꿨다 — 흰 배경 + 상단 헤어라인만으로
 * 콘텐츠와 분리한다. 아이콘은 lucide의 선(line) 스타일 대신 실루엣이 꽉 찬 filled
 * 아이콘(Heroicons solid)을 쓴다 — lucide는 스트로크 기반이라 그대로 채우면 어색해서
 * 이 자리만 별도 아이콘 세트를 쓴다. 선택된 탭은 우리 서비스의 포인트 컬러(accent)로,
 * 나머지는 잉크 회색으로 구분한다.
 * 조건입력(위저드)·결과 준비 로딩 화면은 하나의 흐름에 몰입해야 하므로 탭을 숨긴다.
 * 장소 상세 화면도 저장·지도 이동 전용 하단 고정바를 따로 쓰고 있어, 하단에 바가
 * 두 개 겹치지 않도록 여기서도 숨긴다.
 * 결과 목록(/results)도 같은 이유로 숨긴다 — 홈/지도/북마크는 언제든 오갈 수 있는
 * 상시 섹션이지만, 결과는 특정 조건(URL 쿼리)에 묶인 "탐색 흐름의 한 단계"라 세 탭
 * 어디에도 속하지 않는다. 예전엔 바는 떴지만 세 탭 중 어느 것도 활성 표시가 안 돼서
 * "지금 내가 어디 있는지" 알 수 없는 상태로 떠 있었다 — 억지로 한 탭(예: 홈)에
 * 편입시키면 위저드로 들어온 맥락과 안 맞는 탭이 켜진 것처럼 보여 오히려 더 헷갈린다.
 * 위저드·상세와 같은 카테고리로 묶어 아예 숨기는 쪽이 일관적이다.
 */
export function BottomNav() {
  const pathname = usePathname();
  if (
    pathname.startsWith("/search") ||
    pathname.startsWith("/places") ||
    pathname.startsWith("/results")
  )
    return null;

  return (
    <nav
      className="absolute inset-x-0 bottom-0 z-20 border-t border-line bg-cream-soft"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center">
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex flex-1 flex-col items-center justify-center gap-1 py-[17px] transition-colors",
                active ? "text-accent" : "text-ink-faint hover:text-ink-soft",
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[11px] font-semibold leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
