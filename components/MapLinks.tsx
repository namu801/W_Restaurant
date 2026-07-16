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
    <div className="flex gap-2.5">
      <a
        href={mapUrlNaver}
        target="_blank"
        rel="noreferrer"
        onClick={() =>
          track("map_clicked", { place_id: placeId, rank, score, map_type: "naver" })
        }
        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent py-3.5 text-[13px] font-bold text-white transition-colors hover:bg-accent-strong active:bg-accent-strong"
      >
        네이버지도
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
      <a
        href={mapUrlKakao}
        target="_blank"
        rel="noreferrer"
        onClick={() =>
          track("map_clicked", { place_id: placeId, rank, score, map_type: "kakao" })
        }
        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent py-3.5 text-[13px] font-bold text-white transition-colors hover:bg-accent-strong active:bg-accent-strong"
      >
        카카오맵
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
