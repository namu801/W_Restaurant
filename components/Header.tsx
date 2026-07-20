"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { LogoMark } from "@/components/LogoMark";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  // 장소 상세는 사진 위에 떠 있던 뒤로가기 버튼을 여기 헤더 자리로 옮겨왔다.
  // 이 화면에선 로고·의견 보내기 대신 뒤로가기만 보여준다
  const isPlaceDetail = pathname.startsWith("/places/");
  // 조건입력 위저드는 화면마다 상단 영역의 "역할"이 다르다 — 로고 대신 뒤로가기·현재
  // 단계·건너뛰기가 필요해서, 이 공용 헤더는 아예 렌더링하지 않는다. 그 자리는
  // app/search/page.tsx가 프레임 기준 absolute로 직접 그린다(장소 상세의 뒤로가기와
  // 같은 자리·높이를 유지하기 위해 여기서 완전히 비켜준다).
  if (pathname.startsWith("/search")) return null;

  return (
    // border-line/70(옅게 깎은 미색)이 헤더·본문이 같은 cream 계열이라 사실상 안 보였다.
    // 헤어라인 자체 톤(line)은 그대로 두고 불투명도만 걷어서 영역 구분이 되게 한다
    <header className="shrink-0 border-b border-line bg-cream">
      <div className="mx-auto flex max-w-xl items-center justify-between px-6 py-4">
        {isPlaceDetail ? (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="뒤로가기"
            className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-cream-strong active:bg-cream-strong"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
        ) : (
          <Link href="/" className="flex items-center gap-1.5">
            {/* 로고가 텍스트보다 살짝 커 보이도록: 텍스트는 text-lg(18px)인데
                로고 높이는 28px로 잡아 자연스럽게 도드라지게 한다 */}
            <LogoMark className="h-7 w-7 shrink-0" />
            <span className="text-lg font-bold tracking-tight text-ink">청모픽</span>
          </Link>
        )}
        {/* 의견 보내기는 로고와 대비되면 안 되는 부차 동작이지만, 너무 옅으면 있는지도
            모르고 지나친다 — 결과 페이지의 "추천순"과 같은 톤(ink-soft)으로 맞췄다 */}
        {!isPlaceDetail && (
          <Link href="/feedback" className="text-xs font-medium text-ink-soft hover:text-ink">
            의견 보내기
          </Link>
        )}
      </div>
    </header>
  );
}
