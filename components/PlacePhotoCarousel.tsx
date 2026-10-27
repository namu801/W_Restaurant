import Image from "next/image";
import type { Place } from "@/lib/types";
import { PlaceThumbnail } from "@/components/PlaceThumbnail";

/**
 * 상세 페이지 사진. 결과 목록과 같은 둥근 모서리로 맞추고, 다음 사진이 오른쪽에 살짝 걸쳐 보이게 해
 * 점 표시 없이도 "넘겨볼 수 있다"는 걸 알린다(캐치테이블 상세와 같은 방식).
 * 오른쪽만 화면 끝까지 이어 붙여서, 마지막 사진도 왼쪽 정렬선은 이름·정보 줄과 같다.
 */
export function PlacePhotoCarousel({ place }: { place: Place }) {
  if (place.photos.length <= 1) {
    return <PlaceThumbnail place={place} className="h-60 w-full rounded-md" iconClassName="h-16 w-16" sizes="430px" />;
  }

  return (
    <div className="scrollbar-hide -mr-6 flex snap-x snap-mandatory gap-2 overflow-x-auto pr-6">
      {place.photos.map((photo, i) => (
        <div key={photo} className="relative h-60 w-[86%] shrink-0 snap-start overflow-hidden rounded-md bg-cream-strong">
          <Image
            src={photo}
            alt={`${place.name} 사진 ${i + 1}`}
            fill
            sizes="380px"
            priority={i === 0}
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
