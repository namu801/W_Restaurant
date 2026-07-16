"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/** 상세 페이지 히어로 사진 위에 뜨는 뒤로가기. 목록에서 들어온 경우 그 스크롤 위치로 그대로 돌아간다 */
export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="뒤로가기"
      // 히어로 배경이 sage/gold/clay/accent-soft 중 하나라 다 밝은 파스텔이다. bg-ink/45는
      // 이 위에서 흰 아이콘과 대비가 3:1에도 못 미쳐(sage-soft 기준 실측 2.72:1) 안 보일 수 있다.
      className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-ink/70 text-white backdrop-blur-sm transition-colors hover:bg-ink/80 active:bg-ink/85"
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}
