import Image from "next/image";
import { clsx } from "clsx";
import { Utensils } from "lucide-react";
import { CUISINE_ICON } from "@/lib/option-icons";
import type { Place } from "@/lib/types";

/** 실사진이 없는 곳(현재는 없지만 향후 데이터 추가 대비)을 위한 대체 팔레트.
 *  음식 종류 아이콘을 은은한 배경 위에 올려서 목록에서 장소를 시각적으로 구분한다 */
const PALETTE = ["bg-sage-soft", "bg-gold-soft", "bg-clay-soft", "bg-accent-soft"];

/** 첫 글자만 보면 실제 id들이 한쪽으로 몰려 색이 거의 안 섞인다. 문자열 전체를 섞어 고르게 편차를 준다 */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function PlaceThumbnail({
  place,
  className,
  iconClassName = "h-7 w-7",
  paletteOffset = 0,
}: {
  place: Place;
  className?: string;
  /** 타일 크기에 맞춰 아이콘 자체의 가로·세로를 명시적으로 지정한다 (예: "h-16 w-16").
   *  사진이 있으면 쓰이지 않고, 플레이스홀더로 대체될 때만 적용된다 */
  iconClassName?: string;
  /** 사진 여러 장 스트립에서 같은 장소의 다른 사진(1번째, 2번째...)을 나란히 보여줄 때 쓴다.
   *  사진이 없으면 대신 플레이스홀더 배경색을 바꾸는 용도로 쓰인다 */
  paletteOffset?: number;
}) {
  if (place.photos.length > 0) {
    const photo = place.photos[paletteOffset % place.photos.length];
    return (
      <div className={clsx("relative shrink-0 overflow-hidden bg-cream-strong", className)}>
        {/* 세로·가로 사진이 섞여 있어 비율이 제각각이다. object-cover로 칸 높이에 맞춰
            꽉 채우고 넘치는 부분은 잘라내— 실제 방문 사진이니 잘려도 어색하지 않다 */}
        <Image
          src={photo}
          alt={place.name}
          fill
          sizes="200px"
          className="object-cover"
        />
      </div>
    );
  }

  const cuisine = place.cuisineTags[0];
  const { Icon } = cuisine ? CUISINE_ICON[cuisine] : { Icon: Utensils };
  const paletteBg = PALETTE[(hashString(place.id) + paletteOffset) % PALETTE.length];

  return (
    <div
      className={clsx(
        // 모서리 둥글기는 항상 호출부 className에서 정한다. 여기서 기본값(rounded-md)을 깔아두면
        // Tailwind의 borderRadius 스케일 순서상 rounded-none을 넘겨도 rounded-md가 이겨버린다.
        "flex shrink-0 items-center justify-center",
        paletteBg,
        className,
      )}
    >
      <Icon className={clsx(iconClassName, "text-ink")} strokeWidth={1.6} />
    </div>
  );
}
