/** 정식 로고(public/logo_v2.svg)로 교체 — 배경 없이 두 개의 사선 막대가 겹쳐진
 *  블루 그라디언트 마크다. 크기에 관계없이 선명하게 렌더링되도록 인라인 SVG로 둔다. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 278 277" fill="none" className={className} aria-hidden>
      <rect
        opacity="0.85"
        width="73.7885"
        height="195.168"
        rx="36.8943"
        transform="matrix(-0.768812 0.639475 0.639475 0.768812 49.2388 61.509)"
        fill="url(#logo-mark-gradient-1)"
      />
      <rect
        width="76.2084"
        height="247.255"
        rx="38.1042"
        transform="matrix(-0.784705 -0.619869 -0.619869 0.784705 281.568 64.3866)"
        fill="url(#logo-mark-gradient-2)"
      />
      <defs>
        <linearGradient
          id="logo-mark-gradient-1"
          x1="36.8943"
          y1="0"
          x2="36.8943"
          y2="195.168"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#A6CCFF" />
          <stop offset="1" stopColor="#2978ED" />
        </linearGradient>
        <linearGradient
          id="logo-mark-gradient-2"
          x1="38.1042"
          y1="0"
          x2="38.1042"
          y2="247.255"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#026AF9" stopOpacity="0.6" />
          <stop offset="1" stopColor="#006BF9" />
        </linearGradient>
      </defs>
    </svg>
  );
}
