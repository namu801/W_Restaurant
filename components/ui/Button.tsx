import { clsx } from "clsx";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

// 원티드는 press-overshoot(눌림 축소) 자체가 없다 — hover는 darken(버튼)/lighten(링크)
// 뿐이고 spring·bounce·scale은 잡카드의 hover lift 정도를 빼면 시스템 전반에 등장하지 않는다.
// 그래서 여긴 순수 색 트랜지션만 남긴다(100~150ms가 표준이라 Tailwind 기본 150ms와 맞아떨어진다).
const base =
  "inline-flex items-center justify-center gap-1.5 rounded-md px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

// solid(primary) → outlined(secondary) → assistive(ghost, 중성 필) 3단 위계.
// "화면당 단일 강조색" 원칙대로 브랜드 블루는 primary에만 배경으로 쓰고, 나머지는
// 브랜드색을 텍스트로만 쓰거나(secondary) 아예 중성색으로 낮춘다(ghost).
const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-strong",
  secondary: "border border-line bg-cream-soft text-accent hover:bg-accent-soft",
  ghost: "bg-cream text-ink hover:bg-cream-strong",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(base, variants[variant], className)}
      {...props}
    />
  );
}

interface LinkButtonProps {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
  onClick,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(base, variants[variant], className)}
    >
      {children}
    </Link>
  );
}
