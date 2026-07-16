"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Bookmark, Home, MapPin } from "lucide-react";

const ITEMS = [
  { href: "/", label: "홈", icon: Home, match: (p: string) => p === "/" },
  {
    href: "/map",
    label: "지도",
    icon: MapPin,
    match: (p: string) => p.startsWith("/map"),
  },
  {
    href: "/bookmarks",
    label: "북마크",
    icon: Bookmark,
    match: (p: string) => p.startsWith("/bookmarks"),
  },
] as const;

/**
 * 홈/결과/북마크함 등에서 보이는 하단 탭.
 * 화면 가장자리에 붙이지 않고 둥글게 띄운 플로팅 바 형태로 만든다.
 * 조건입력(위저드)·결과 준비 로딩 화면은 하나의 흐름에 몰입해야 하므로 탭을 숨긴다.
 * 장소 상세 화면도 저장·지도 이동 전용 하단 고정바를 따로 쓰고 있어, 하단에 바가
 * 두 개 겹치지 않도록 여기서도 숨긴다.
 */
export function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/search") || pathname.startsWith("/places")) return null;

  return (
    <nav
      className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-6"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
    >
      <div className="flex items-center gap-1 rounded-[28px] border border-line bg-cream-soft/95 p-1.5 shadow-card backdrop-blur">
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex w-16 flex-col items-center justify-center gap-0.5 rounded-full py-1.5 transition-colors",
                active
                  ? "bg-accent-strong text-white"
                  : "text-ink-faint hover:bg-cream-strong hover:text-ink-soft",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-semibold leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
