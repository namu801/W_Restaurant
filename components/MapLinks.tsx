"use client";

import { MapPin } from "lucide-react";
import { track } from "@/lib/analytics";

export function MapLinks({
  placeId,
  mapUrlNaver,
  mapUrlKakao,
  rank,
  score,
  page,
}: {
  placeId: string;
  mapUrlNaver: string;
  mapUrlKakao: string;
  rank?: number;
  score?: number;
  /** 같은 이름의 map_clicked가 북마크 목록(app/bookmarks)에서도 따로 발생해서, 어느 화면에서
   *  누른 클릭인지 이 속성 없인 믹스패널에서 구분할 수 없었다 — "상세 조회 → 지도 클릭" 같은
   *  퍼널을 만들 때 이 값으로 걸러야 정확하다 */
  page: "detail" | "bookmarks";
}) {
  return (
    <div className="flex gap-2.5">
      {/* 브랜드 색만 아이콘 배지에 담고, 버튼 자체는 흰 배경 + 아웃라인으로 톤을 낮췄다.
       *  전엔 두 버튼 다 코랄 배경이라 화면에서 너무 튀었다 */}
      <a
        href={mapUrlNaver}
        target="_blank"
        rel="noreferrer"
        onClick={() =>
          track("map_clicked", { place_id: placeId, rank, score, map_type: "naver", page })
        }
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-cream-soft py-3.5 text-[13px] font-bold text-ink transition-all hover:bg-cream-strong active:bg-cream-strong"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] bg-[#03C75A]">
          <MapPin className="h-3 w-3 text-white" strokeWidth={2.5} fill="white" />
        </span>
        네이버지도
      </a>
      <a
        href={mapUrlKakao}
        target="_blank"
        rel="noreferrer"
        onClick={() =>
          track("map_clicked", { place_id: placeId, rank, score, map_type: "kakao", page })
        }
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-cream-soft py-3.5 text-[13px] font-bold text-ink transition-all hover:bg-cream-strong active:bg-cream-strong"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] bg-[#FEE500]">
          <MapPin className="h-3 w-3 text-ink" strokeWidth={2.5} fill="#3C1E1E" />
        </span>
        카카오맵
      </a>
    </div>
  );
}
