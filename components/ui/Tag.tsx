import { clsx } from "clsx";
import type { ReactNode } from "react";

type TagVariant = "neutral" | "accent" | "warning" | "positive";

const variants: Record<TagVariant, string> = {
  neutral: "bg-cream-strong text-ink-soft",
  accent: "bg-accent-soft text-accent-strong",
  warning: "bg-clay-soft text-clay",
  positive: "bg-sage-soft text-sage",
};

export function Tag({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: TagVariant;
}) {
  return (
    <span
      className={clsx(
        // whitespace-nowrap이 없으면, 옆에 긴 텍스트(식당명 등)가 줄바꿈되면서 이 배지도
        // 같이 눌려 "청모픽 1순위"가 "청모픽 1순/위"처럼 단어 중간에서 줄바꿈됐다 —
        // 배지는 항상 한 줄이어야 하는 짧은 라벨이라 절대 안 꺾이게 고정한다
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        variants[variant],
      )}
    >
      {children}
    </span>
  );
}
