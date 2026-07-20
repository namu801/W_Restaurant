import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // 원티드 디자인 시스템을 우리 프로덕트에 맞게 옮긴 팔레트. 토큰 "이름"은 기존
      // 컴포넌트가 그대로 쓸 수 있도록 유지하고(cream/ink/line/accent/sage/clay/gold),
      // 값만 원티드의 dual-neutral + alpha 위계 체계로 교체했다.
      // 원티드는 alpha multiplier로 텍스트 위계를 만들지만(예: fg-default = neutral-875 @ 88%),
      // 우리 토큰 구조는 처음부터 "미리 계산된 solid 색" 4단계(DEFAULT/soft/faint/faintest)라
      // 각 alpha 값을 흰 배경 위에 합성한 solid hex로 미리 구워서 넣었다 — 카드/페이지 배경이
      // 거의 항상 흰색·연회색이라 렌더 결과는 실제 alpha 합성과 시각적으로 동일하다.
      colors: {
        cream: {
          DEFAULT: "#F5F5F7", // neutral-50 (bg-subtle) — 페이지 바닥면
          soft: "#FFFFFF", // bg-surface — 카드/표면
          strong: "#F2F2F3", // neutral-75 (bg-muted) — hover 채움
        },
        ink: {
          DEFAULT: "#0A0B0C", // fg-strong — 헤드라인, 카드 타이틀 등 강조 텍스트
          soft: "#7E7F82", // fg-secondary(alpha 61% 합성) — 보조 텍스트, 캡션
          faint: "#A4A5A7", // fg-tertiary(alpha 43% 합성) — 메타 정보, placeholder
          faintest: "#C4C4C6", // fg-disabled(alpha 28% 합성) — 비활성 텍스트
        },
        line: {
          // 원티드는 border-subtle(8%)/default(22%)/strong(35%) 3단만 쓴다. 우리 3단 토큰에
          // 그대로 맞춰서 soft는 subtle과 같은 값(더 옅은 4번째 단이 원본에 없다)을 쓴다.
          DEFAULT: "#F3F3F4", // border-subtle — 카드 헤어라인 기본값
          soft: "#F3F3F4",
          strong: "#DDDEE0", // border-default — hover 시 한 단계 진해지는 보더
        },
        accent: {
          DEFAULT: "#006BF9", // blue-800 — 유일한 브랜드 컬러. 흰 텍스트/흰 배경 모두 AA 통과(4.7:1)
          soft: "#E5F1FF", // blue-100 (bg-brand-subtle)
          strong: "#0055CF", // blue-900 — hover 강조 + 옅은 배경 위 텍스트로도 안전
        },
        sage: {
          DEFAULT: "#117F20", // green-600 계열(성공/긍정) — 원본보다 짙게 조정해 AA 통과
          soft: "#DBFFE5", // green-100 (bg-success-subtle)
        },
        clay: {
          DEFAULT: "#A8590E", // orange-700 계열(주의/경고) — 원본보다 짙게 조정해 AA 통과
          soft: "#FFF3DE", // orange-100 (bg-warning-subtle)
        },
        gold: {
          // 원티드 팔레트엔 골드가 없다 — hover·select 강조/일러스트용으로 제공되는 6색
          // 확장 램프(lime/cyan/sky/violet/purple/pink) 중 violet을 카테고리 태깅용
          // 네 번째 아이콘 색으로 재사용한다.
          DEFAULT: "#5E33F5", // violet-600
          soft: "#F2EFFA",
        },
        // 프레임 바깥(넓은 뷰포트) 배경. 원티드 neutral-925(토스트 배경과 동일 톤)를 그대로 써서
        // 프레임 안 cool-neutral 톤과 이어지게 한다.
        studio: "#141519",
      },
      // 원티드는 본문/UI를 Pretendard(JP) 하나로 통일하고, Wanted Sans는 마케팅 대형 헤드라인
      // 전용이라 필수가 아니다 — 이번 라운드는 새 폰트 로딩 없이 기존 자체 호스팅 Pretendard를
      // 그대로 쓴다. font-serif/font-sans 이름은 기존 컴포넌트가 그대로 쓰지만 둘 다 Pretendard다.
      fontFamily: {
        sans: ["var(--font-pretendard)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        serif: ["var(--font-pretendard)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        // 원티드 radius 사다리(2/4/8/12/16/20/24/32/full)에서 우리가 실제로 쓰는 4단만 추렸다.
        // "대부분의 컴포넌트는 radius-8 또는 radius-12를 쓴다"는 원칙 그대로 sm/md에 배치.
        sm: "8px", // 버튼, 배지, 툴팁, 잡카드(=장소카드) 썸네일
        md: "12px", // 입력 필드, 드롭다운, alert
        lg: "16px", // 범용 카드, 히어로 배너
        xl: "24px", // 바텀시트 상단 코너
      },
      boxShadow: {
        // 원티드는 카드에 그림자를 쓰지 않는다(1px border-subtle 헤어라인이 구조를 짊어짐) —
        // 그림자는 popover/dropdown/modal/toast 같은 "떠 있는" 표면에만 쓴다. 그래서 이 토큰은
        // 카드가 아니라 BottomNav·StickyBottomBar·토스트처럼 실제로 떠 있는 크롬 전용으로 쓴다.
        card: "0 8px 24px rgba(0, 0, 0, 0.12)", // shadow-pop — 떠 있는 크롬 전용
        sheet: "0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.07)", // shadow-4 — 모달/시트
      },
    },
  },
  plugins: [],
};

export default config;
