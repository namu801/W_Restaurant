import {
  Beef,
  Coffee,
  Fish,
  Shell,
  Soup,
  Sparkles,
  Utensils,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from "lucide-react";
import type { CuisineKey } from "./types";

/**
 * 음식 종류 아이콘. 사진이 없는 식당의 썸네일 자리(PlaceThumbnail)와 지도 필터 칩에 쓴다.
 * 이모지는 기기마다 다르게 그려져서 lucide 아이콘을 카테고리별 브랜드 색으로 칠해 쓴다.
 * (조건 입력 화면은 이제 아이콘 대신 짧은 말·사진으로 고른다 — app/search 참고)
 */
export interface CategoryIcon {
  Icon: LucideIcon;
  color: string; // Tailwind text-color 유틸리티
}

export const CUISINE_ICON: Record<CuisineKey, CategoryIcon> = {
  korean: { Icon: Soup, color: "text-clay" },
  western: { Icon: UtensilsCrossed, color: "text-sage" },
  japanese: { Icon: Fish, color: "text-gold" },
  chinese: { Icon: Utensils, color: "text-accent-strong" },
  meat: { Icon: Beef, color: "text-clay" },
  seafood: { Icon: Shell, color: "text-sage" },
  "wine-alcohol": { Icon: Wine, color: "text-accent-strong" },
  "brunch-cafe": { Icon: Coffee, color: "text-gold" },
  any: { Icon: Sparkles, color: "text-ink-soft" },
};
