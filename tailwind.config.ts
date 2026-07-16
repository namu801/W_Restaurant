import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 웨딩 스테이셔너리 무드보드에서 뽑은 팔레트 (크림 캔버스 + 웜톤).
        cream: {
          DEFAULT: "#FBF6EC", // canvas — 페이지 바닥면
          soft: "#FFFDF8", // canvas-raised — 카드/표면
          strong: "#F3EADA", // 살짝 더 진한 크림, 드문 강조용
        },
        ink: {
          DEFAULT: "#4A3F35", // 웜 브라운 잉크 — 헤드라인, 본문
          soft: "#7A6D60", // 보조 텍스트
          faint: "#A89A8A", // 캡션, 메타 정보
          faintest: "#C9BCAC", // 매우 옅은 비활성 텍스트
        },
        line: {
          DEFAULT: "#E7D9C9", // 헤어라인
          soft: "#F0E6D8",
          strong: "#D8C6B0",
        },
        accent: {
          DEFAULT: "#E56C6C", // 코랄 — 이 서비스의 유일한 브랜드 액센트
          soft: "#FBE3E1", // 옅은 코랄 틴트 배경
          strong: "#C94F4F", // 눌림/강조 상태
        },
        sage: {
          DEFAULT: "#6E7C52", // 체크포인트 "positive" 톤, 골든아워 정원 파티 느낌의 세이지 그린
          soft: "#E6EAD9",
        },
        clay: {
          DEFAULT: "#B5574A", // 체크포인트 "warning" 톤 — 테라코타 계열
          soft: "#F1E1DD",
        },
        gold: {
          DEFAULT: "#A67C1D", // 머스타드 — 스몰캡스 라벨 등 아주 드물게만 사용
          soft: "#F3E7CB",
        },
        // 브라우저 폭이 넓을 때 앱 프레임 바깥을 채우는 배경. 이전엔 옅은 웜그레이라 프레임의
        // cream 배경과 거의 구분이 안 됐다 — 폭 경계가 "한눈에" 보이려면 크림 톤이 아니라
        // 뚜렷하게 어두운 색이어야 한다 (참고 이미지의 검은 여백과 같은 역할).
        studio: "#141210",
      },
      // 폰트는 Pretendard 하나로 통일한다. font-serif/font-sans 클래스 이름은 컴포넌트
      // 전반에 이미 쓰이고 있어 그대로 두고, 두 값이 가리키는 실제 서체만 Pretendard로 맞춘다.
      fontFamily: {
        sans: ["var(--font-pretendard)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        serif: ["var(--font-pretendard)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        // 토스·당근마켓류 국내 모바일 서비스는 필(pill)을 남발하지 않고 절제된 라운드를 쓴다.
        // 필은 작은 배지/칩에만 한정하고, 카드·CTA는 12~16px 선에서 정리한다.
        sm: "10px", // 체크포인트 행 등 작은 요소
        md: "14px", // 옵션 카드, 밸류 카드
        lg: "16px", // 장소 카드, 하단 고정 CTA 바
        xl: "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(74, 63, 53, 0.05), 0 12px 28px -14px rgba(74, 63, 53, 0.28)",
      },
    },
  },
  plugins: [],
};

export default config;
