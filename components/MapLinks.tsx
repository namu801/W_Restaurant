"use client";

import { ExternalLink } from "lucide-react";
import { track } from "@/lib/analytics";

export function MapLinks({
  placeId,
  mapUrlNaver,
  mapUrlKakao,
  rank,
  score,
}: {
  placeId: string;
  mapUrlNaver: string;
  mapUrlKakao: string;
  rank?: number;
  score?: number;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <a
        href={mapUrlNaver}
        target="_blank"
        rel="noreferrer"
        onClick={() =>
          track("map_clicked", { place_id: placeId, rank, score, map_type: "naver" })
        }
        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line bg-white px-4 py-3 text-sm font-medium text-ink-soft hover:border-ink-faint"
      >
        네이버지도에서 보기
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
      <a
        href={mapUrlKakao}
        target="_blank"
        rel="noreferrer"
        onClick={() =>
          track("map_clicked", { place_id: placeId, rank, score, map_type: "kakao" })
        }
        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line bg-white px-4 py-3 text-sm font-medium text-ink-soft hover:border-ink-faint"
      >
        카카오맵에서 보기
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
