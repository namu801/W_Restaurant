"use client";

import Image from "next/image";
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
      {/* 아이콘은 각 앱의 공식 앱 아이콘(public/icons, 앱스토어 아이콘)을 쓴다 — 사용자가 홈 화면에서
       *  보던 그 모양이라 어느 앱으로 넘어가는지 바로 알아본다. 버튼 자체는 흰 배경 + 아웃라인으로 톤을 낮췄다 */}
      <a
        href={mapUrlNaver}
        target="_blank"
        rel="noreferrer"
        onClick={() =>
          track("map_clicked", { place_id: placeId, rank, score, map_type: "naver", page })
        }
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-cream-soft py-3.5 text-caption font-bold text-ink transition-all hover:bg-cream-strong active:bg-cream-strong"
      >
        <Image
          src="/icons/naver-map.png"
          alt=""
          width={22}
          height={22}
          className="h-[22px] w-[22px] shrink-0 rounded-[6px] ring-1 ring-line"
        />
        네이버지도
      </a>
      <a
        href={mapUrlKakao}
        target="_blank"
        rel="noreferrer"
        onClick={() =>
          track("map_clicked", { place_id: placeId, rank, score, map_type: "kakao", page })
        }
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-cream-soft py-3.5 text-caption font-bold text-ink transition-all hover:bg-cream-strong active:bg-cream-strong"
      >
        <Image src="/icons/kakao-map.png" alt="" width={22} height={22} className="h-[22px] w-[22px] shrink-0 rounded-[6px]" />
        카카오맵
      </a>
    </div>
  );
}
