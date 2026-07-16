"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  // 조건입력 위저드는 하나의 흐름에 몰입해야 하는 화면이라(BottomNav도 여기서 숨긴다),
  // 이탈 유도가 될 수 있는 '의견 보내기' 링크도 이 흐름에서는 같이 숨긴다
  const showFeedbackLink = !pathname.startsWith("/search");

  return (
    <header className="shrink-0 border-b border-line/70 bg-cream">
      <div className="mx-auto flex max-w-xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-1.5">
          {/* 로고가 텍스트보다 살짝 커 보이도록: 텍스트는 text-lg(18px)인데
              로고 높이는 28px로 잡아 자연스럽게 도드라지게 한다 */}
          <Image src="/logo.png" alt="" width={28} height={28} priority className="h-7 w-7" />
          <span className="font-serif text-lg font-bold tracking-tight text-ink">청모픽</span>
        </Link>
        {/* 의견 보내기는 로고와 대비되면 안 되는 부차 동작이라, 강조 없는 텍스트 링크로만 둔다 */}
        {showFeedbackLink && (
          <Link href="/feedback" className="text-xs font-medium text-ink-faint hover:text-ink-soft">
            의견 보내기
          </Link>
        )}
      </div>
    </header>
  );
}
