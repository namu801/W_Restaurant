import {
  Armchair,
  CalendarCheck,
  Clock3,
  HeartHandshake,
  MapPinned,
  MessageCircle,
  Sparkles,
  Star,
  SquareParking,
  Users,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { ReasonIconKey } from "@/lib/icon-keys";

export const ICON_MAP: Record<ReasonIconKey, LucideIcon> = {
  users: Users,
  "map-pinned": MapPinned,
  wallet: Wallet,
  "utensils-crossed": UtensilsCrossed,
  "message-circle": MessageCircle,
  "heart-handshake": HeartHandshake,
  armchair: Armchair,
  "calendar-check": CalendarCheck,
  "clock-3": Clock3,
  star: Star,
  "square-parking": SquareParking,
  sparkles: Sparkles,
};

/** 조건입력 위저드의 CategoryIcon과 같은 팔레트(sage/gold/clay/accent-strong)를 그대로 돌려써서
 *  서비스 전체에 아이콘 톤이 하나로 통일되게 한다. 색 자체엔 긍정/부정 같은 의미를 담지 않는다 —
 *  체크포인트의 톤(체크/느낌표 아이콘)이 이미 그 역할을 한다 */
export const ICON_COLOR: Record<ReasonIconKey, string> = {
  users: "text-sage",
  "map-pinned": "text-accent-strong",
  wallet: "text-gold",
  "utensils-crossed": "text-clay",
  "message-circle": "text-sage",
  "heart-handshake": "text-accent-strong",
  armchair: "text-gold",
  "calendar-check": "text-clay",
  "clock-3": "text-sage",
  star: "text-gold",
  "square-parking": "text-accent-strong",
  sparkles: "text-clay",
};
