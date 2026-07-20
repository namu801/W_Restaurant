/** 코랄 리본 모양의 기존 로고 PNG가 우리 블루 톤 팔레트와 맞지 않아 걷어냈다. 정식
 *  로고를 만들기 전 임시로, 큐레이션 배지에 쓴 것과 같은 accent→gold 그라디언트를
 *  체크(✓) 아이콘에 입혀서 "골라준다"는 서비스 정체성과 브랜드 톤을 동시에 담았다.
 *  PNG 대신 인라인 SVG라 그라디언트를 크기에 관계없이 선명하게 렌더링한다. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="logo-mark-gradient" x1="0" y1="0" x2="28" y2="28">
          <stop offset="0%" stopColor="#006BF9" />
          <stop offset="100%" stopColor="#5E33F5" />
        </linearGradient>
      </defs>
      <rect width="28" height="28" rx="8" fill="url(#logo-mark-gradient)" />
      <path
        d="M8.5 14.5L12.2 18.2L19.5 10"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
