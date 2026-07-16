import { clsx } from "clsx";
import { Utensils } from "lucide-react";
import { CUISINE_ICON } from "@/lib/option-icons";
import type { Place } from "@/lib/types";

/**
 * 실제 매장 사진이 없는 데모 데이터라, 사진을 대체할 스타일드 플레이스홀더를 쓴다.
 * 음식 종류 아이콘(조건입력에서 쓰는 것과 같은 카테고리 색)을 은은한 배경 위에 올려서
 * 목록에서 장소를 시각적으로 구분할 수 있게 한다. 실사진이 준비되면 <img>로 교체하면 된다.
 */
const PALETTE = ["bg-sage-soft", "bg-gold-soft", "bg-clay-soft", "bg-accent-soft"];

/** 첫 글자만 보면 실제 id들이 한쪽 나머지로 몰려 색이 거의 안 섞인다. 문자열 전체를 섞어 고르게 편차를 준다 */
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
   *  SVG 아이콘은 emoji 때와 달리 text-* 크기에 반응하지 않아 별도 prop으로 뺐다 */
  iconClassName?: string;
  /** 사진 여러 장처럼 보이는 스트립에서, 같은 장소를 같은 아이콘이되 다른 색으로 나란히 보여줄 때 쓴다 */
  paletteOffset?: number;
}) {
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
      {/* 카테고리 고유 색(예: 골드) 대신 고정된 중립 톤을 쓴다. 배경이 4색 중 무작위로
          바뀌기 때문에, 아이콘 색을 카테고리 색 그대로 쓰면 같은 계열 배경과 만났을 때
          대비가 위험할 만큼 낮아지는 조합이 생긴다(예: text-gold on bg-gold-soft = 3.1:1,
          그래픽 요소 최저 기준 3:1을 아슬아슬하게 넘기는 수준이라 안전하지 않다).
          반투명(예: text-ink/70)도 배경과 섞이면 3.8:1 정도라 마진이 작아, 불투명 잉크 색을 쓴다 */}
      <Icon className={clsx(iconClassName, "text-ink")} strokeWidth={1.6} />
    </div>
  );
}
