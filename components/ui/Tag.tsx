import { clsx } from "clsx";
import type { ReactNode } from "react";

type TagVariant = "neutral" | "accent" | "warning" | "positive";

const variants: Record<TagVariant, string> = {
  neutral: "bg-cream-soft text-ink-soft border border-line",
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
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        variants[variant],
      )}
    >
      {children}
    </span>
  );
}
