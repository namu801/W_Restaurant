import type { Config } from "tailwindcss";

/** globals.css의 --color-* 변수를 Tailwind 색으로 노출한다. <alpha-value>는 Tailwind가
 *  bg-accent/25 같은 modifier 값으로 치환한다 */
const themeColor = (name: string) =>
  `color-mix(in oklab, var(--color-${name}) calc(<alpha-value> * 100%), transparent)`;

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // 토큰 구조(DEFAULT/soft/strong 3단)는 그대로 두고,
      // 컬러·서체·그림자 "값"은 app/globals.css의 CSS 변수가 쥐고 있다(테마 교체 지점).
      // 토큰 이름(cream/ink/line/accent/sage/clay/gold)은 기존 컴포넌트가 그대로 쓴다.
      // color-mix로 감싸서 bg-accent/25 같은 불투명도 modifier도 hex·oklch 어느 값이든 그대로 동작한다.
      colors: {
        cream: {
          DEFAULT: themeColor("cream"), // 페이지 바닥면
          soft: themeColor("cream-soft"), // 카드/표면
          strong: themeColor("cream-strong"), // hover·pressed 채움
        },
        ink: {
          DEFAULT: themeColor("ink"), // 헤드라인, 카드 타이틀 등 강조 텍스트
          soft: themeColor("ink-soft"), // 보조 텍스트, 캡션
          faint: themeColor("ink-faint"), // 메타 정보
          faintest: themeColor("ink-faintest"), // placeholder, 비활성 텍스트
        },
        line: {
          DEFAULT: themeColor("line"),
          soft: themeColor("line-soft"),
          strong: themeColor("line-strong"), // 확실히 보여야 하는 보더, 구분 밴드
        },
        accent: {
          DEFAULT: themeColor("accent"),
          soft: themeColor("accent-soft"), // 옅은 브랜드 틴트 배경(배지·태그)
          strong: themeColor("accent-strong"), // pressed, 옅은 틴트 위 텍스트
          light: themeColor("accent-light"), // 그라디언트 전용 짝
          "light-soft": themeColor("accent-light-soft"), // 선택 상태 채움
          glow: themeColor("accent-glow"), // 홈 대표 버튼 그라디언트의 밝은 쪽
        },
        sage: { DEFAULT: themeColor("sage"), soft: themeColor("sage-soft") }, // 긍정/성공
        clay: { DEFAULT: themeColor("clay"), soft: themeColor("clay-soft") }, // 주의/경고
        gold: { DEFAULT: themeColor("gold"), soft: themeColor("gold-soft") }, // 아이콘 4번째 카테고리 색
        // 프레임 바깥(넓은 뷰포트) 배경. 브랜드 톤과 무관한 중성 다크 크롬이라 테마를 타지 않는다.
        studio: "#141519",
      },
      fontFamily: {
        // font-serif/font-sans 이름은 기존 컴포넌트가 그대로 쓰지만 둘 다 같은 본문 서체다
        sans: ["var(--font-body)"],
        serif: ["var(--font-body)"],
      },
      // 타입 스케일. 서체는 Pretendard 하나, 역할 → 크기·줄 간격·자간을 고정한다(굵기는 쓰는 자리에서
      // font-*로 정한다). Pretendard를 대체 서체로 명시한 토스의 타입 램프에 맞췄다 — 본문 15/1.5,
      // 섹션 제목 18, 카드 제목 17, 보조 13. 12·12.5·13처럼 거의 같은 크기가 섞이지 않게 여기 있는
      // 단계만 쓴다. 자간 좁힘은 18px 이상 제목에만 둔다
      fontSize: {
        display: ["26px", { lineHeight: "1.35", letterSpacing: "-0.025em" }], // 홈 히어로
        stat: ["24px", { lineHeight: "1.25", letterSpacing: "-0.02em" }], // 큰 숫자(예산 금액)
        h1: ["22px", { lineHeight: "1.35", letterSpacing: "-0.02em" }], // 화면 제목(질문·식당 이름)
        h2: ["18px", { lineHeight: "1.4", letterSpacing: "-0.02em" }], // 섹션 제목
        title: ["17px", { lineHeight: "1.4", letterSpacing: "-0.01em" }], // 카드 제목
        "title-sm": ["16px", { lineHeight: "1.4" }], // 목록 제목
        button: ["16px", { lineHeight: "1.5" }], // 주요 버튼 — 줄 높이 24px라야 py-3.5와 합쳐 52px 높이가 된다
        body: ["15px", { lineHeight: "1.5" }], // 본문
        "body-sm": ["14px", { lineHeight: "1.5" }], // 카드 안 본문
        label: ["14px", { lineHeight: "1.4" }], // 라벨·칩·정보 줄
        caption: ["13px", { lineHeight: "1.4" }], // 보조·메타
        micro: ["12px", { lineHeight: "1.35" }], // 태그·작은 칩
        tab: ["11px", { lineHeight: "1" }], // 하단 탭
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
        // 카드는 표면색 층위로 먼저 분리하고, 그림자는 떠 있는 소수 요소에만 쓴다
        subtle: "var(--shadow-subtle)",
        card: "var(--shadow-card)",
        sheet: "var(--shadow-sheet)",
        lift: "0 2px 8px rgba(0, 0, 0, 0.06)", // 리스트 카드 hover — 살짝 떠오르는 느낌만
      },
    },
  },
  plugins: [],
};

export default config;
