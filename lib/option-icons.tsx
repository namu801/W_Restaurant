import {
  Beef,
  Briefcase,
  Building2,
  Coffee,
  Fish,
  Gem,
  GraduationCap,
  HeartHandshake,
  Heart,
  Home,
  MoreHorizontal,
  PartyPopper,
  Scale,
  Shell,
  Smile,
  Soup,
  Sparkles,
  Users,
  Utensils,
  UtensilsCrossed,
  VolumeX,
  Volume2,
  Wine,
  Sofa,
  SquareParking,
  Armchair,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import type {
  CuisineKey,
  ExtraConditionKey,
  MoodFormalityKey,
  NoiseKey,
  RelationshipKey,
} from "./types";

/**
 * 조건입력 옵션 카드에 붙는 아이콘. 이전엔 이모지를 썼는데, 기기·브라우저마다 렌더링이
 * 달라 "아이폰 특유의 느낌"이 그대로 드러났다. 대신 이미 쓰고 있던 lucide-react 아이콘을
 * 카테고리별 브랜드 색으로 칠해서, 어디서 봐도 같은 모양의 깔끔한 2D 플랫 아이콘이 되게 했다.
 */
export interface CategoryIcon {
  Icon: LucideIcon;
  color: string; // Tailwind text-color 유틸리티
}

export const RELATIONSHIP_ICON: Record<RelationshipKey, CategoryIcon> = {
  "close-friend": { Icon: Heart, color: "text-accent-strong" },
  "friend-group": { Icon: Users, color: "text-sage" },
  coworker: { Icon: Briefcase, color: "text-clay" },
  "school-senior": { Icon: GraduationCap, color: "text-gold" },
  "workplace-senior": { Icon: Building2, color: "text-sage" },
  family: { Icon: Home, color: "text-accent-strong" },
  other: { Icon: MoreHorizontal, color: "text-ink-soft" },
};

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

export const NOISE_ICON: Record<NoiseKey, CategoryIcon> = {
  quiet: { Icon: VolumeX, color: "text-sage" },
  "lively-but-talkable": { Icon: Volume2, color: "text-gold" },
  "lively-important": { Icon: PartyPopper, color: "text-accent-strong" },
  any: { Icon: Sparkles, color: "text-ink-soft" },
};

export const MOOD_FORMALITY_ICON: Record<MoodFormalityKey, CategoryIcon> = {
  casual: { Icon: Smile, color: "text-gold" },
  balanced: { Icon: Scale, color: "text-sage" },
  hospitable: { Icon: HeartHandshake, color: "text-accent-strong" },
  formal: { Icon: Gem, color: "text-clay" },
  any: { Icon: Sparkles, color: "text-ink-soft" },
};

export const EXTRA_CONDITION_ICON: Record<ExtraConditionKey, CategoryIcon> = {
  "room-required": { Icon: Sofa, color: "text-clay" },
  "parking-required": { Icon: SquareParking, color: "text-sage" },
  "wide-seating": { Icon: Armchair, color: "text-gold" },
  "reservation-possible": { Icon: Calendar, color: "text-accent-strong" },
};
