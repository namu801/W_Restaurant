"use client";

import { useState } from "react";
import Image from "next/image";
import { clsx } from "clsx";
import type { Place } from "@/lib/types";
import { PlaceThumbnail } from "@/components/PlaceThumbnail";

/**
 * 상세 페이지 히어로. 사진이 여러 장이면 좌우로 스와이프해서 넘겨볼 수 있고, 지금 몇 번째
 * 사진인지 하단 점으로 보여준다. 사진이 없는 곳(플레이스홀더만 있는 경우)은 굳이 스와이프
 * UI를 얹지 않고 예전처럼 단일 이미지로 둔다.
 */
export function PlacePhotoCarousel({ place }: { place: Place }) {
  const [index, setIndex] = useState(0);

  if (place.photos.length <= 1) {
    return (
      <div className="-mx-6 -mt-8">
        <PlaceThumbnail place={place} className="h-64" iconClassName="h-16 w-16" />
      </div>
    );
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.clientWidth === 0) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div className="relative -mx-6 -mt-8">
      <div
        onScroll={handleScroll}
        className="flex h-64 snap-x snap-mandatory overflow-x-auto"
      >
        {place.photos.map((photo, i) => (
          <div key={photo} className="relative h-64 w-full shrink-0 snap-start">
            <Image
              src={photo}
              alt={`${place.name} 사진 ${i + 1}`}
              fill
              sizes="430px"
              priority={i === 0}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
        {place.photos.map((_, i) => (
          <span
            key={i}
            aria-hidden
            className={clsx(
              "h-1.5 rounded-full bg-white transition-all",
              i === index ? "w-4 opacity-100" : "w-1.5 opacity-50",
            )}
          />
        ))}
      </div>
      <span className="sr-only" role="status">
        {index + 1}번째 사진, 총 {place.photos.length}장
      </span>
    </div>
  );
}
