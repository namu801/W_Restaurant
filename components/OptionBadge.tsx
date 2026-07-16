import { clsx } from "clsx";
import type { OptionDef, Question } from "@/lib/wizard-questions";

const SIZE = {
  sm: { footprint: "h-7 w-7", icon: "h-4 w-4" },
  md: { footprint: "h-8 w-8", icon: "h-5 w-5" },
} as const;

/**
 * 조건입력 옵션 카드의 뱃지 슬롯. 인원·예산·지역처럼 뱃지가 라벨과 중복되거나
 * (지역은 역 이름을 지하철 노선 배지로 다시 보여주는 게 오히려 정보 과잉이라는 피드백을
 * 받아 텍스트만 남겼다) 의미가 없는 질문은 아무것도 렌더링하지 않는다.
 */
export function OptionBadge({
  question,
  option,
  size = "md",
}: {
  question: Question;
  option: OptionDef;
  size?: "sm" | "md";
}) {
  const s = SIZE[size];

  if (!option.icon) return null;

  const { Icon, color } = option.icon;

  return (
    <span className={clsx(s.footprint, "flex shrink-0 items-center justify-center")}>
      <Icon className={clsx(s.icon, color)} strokeWidth={1.8} />
    </span>
  );
}
