# 청첩자리 비주얼 리프레시 구현 계획

> **에이전트 작업자용:** 필수 서브 스킬 — 이 계획을 태스크 단위로 실행할 때는 superpowers:subagent-driven-development(권장) 또는 superpowers:executing-plans를 사용하세요. 각 스텝은 체크박스(`- [ ]`) 문법으로 진행 상황을 추적합니다.

**목표:** 제품 로직·카피·데이터 흐름은 전혀 바꾸지 않고, 평범한 테두리 박스 카드 위주였던 청첩자리의 비주얼을 좀 더 에디토리얼하고 "청첩장" 모티프가 느껴지는 정체성으로 끌어올린다.

**아키텍처:** 순수 프레젠테이션 레이어 변경. 기존 Tailwind 컬러 토큰은 이름은 그대로 두고 값만 더 짙게 다듬으며(리치한 hex 값), Pretendard 본문 폰트를 자체 호스팅하고 Noto Serif KR 디스플레이 폰트를 추가한다. 시그니처 비주얼 모티프로 스캘럽(부채꼴) 형태의 "봉인(wax seal)" 점수 배지(`SealBadge`)를 도입하고, 랜딩·결과·장소 상세 화면 전반에서 박스 테두리 카드를 헤어라인(가는 선) 구분선으로 교체한다.

**기술 스택:** Next.js 15 App Router, React 19, Tailwind CSS 3, `next/font/google` + `next/font/local`, `pretendard` npm 패키지(자체 호스팅 가변 폰트), `clsx`, `lucide-react`.

## 전역 제약 조건

- 이 저장소에는 테스트 러너가 구성되어 있지 않다 (`package.json`에 `jest`/`vitest`/`playwright` 없음, `*.test.*` 파일 없음). 새로운 비즈니스 로직 없이 순수 비주얼 레이어만 바꾸는 작업이므로, 각 태스크에서 자동화 테스트 대신 다음을 검증 수단으로 사용한다: (a) 타입/JSX 오류를 잡기 위한 `npx tsc --noEmit`, (b) 로컬 개발 서버(`npm run dev`, 이 프로젝트에서 이미 쓰던 방식)에서 특정 라우트를 눈으로 확인하는 수동 시각 검증. CSS 클래스 변경을 위해 가짜 단위 테스트를 지어내지 않는다.
- 기존 Tailwind 컬러 토큰 **이름**(`cream`, `ink`, `line`, `accent`, `sage`, `clay`)은 그대로 유지하고 hex 값만 바꾼다. 여기에 새 토큰(`brass`) 하나만 추가한다. 이렇게 하면 이미 이 토큰 클래스(`bg-cream`, `text-ink-soft`, `border-line` 등)를 쓰는 모든 파일이 코드 수정 없이 자동으로 새 팔레트를 적용받으며, 구조적으로 손댈 이유가 없다면 건드리지 않는다.
- 한글 카피, 라우트 구조, 애널리틱스 이벤트명/속성, 매칭·스코어링 로직(`lib/scoring.ts`, `lib/reason.ts`, `lib/checkpoints.ts`)은 이번 작업 범위 밖이며 변경하지 않는다.
- 모바일 우선 단일 컬럼 레이아웃(`app/layout.tsx`의 `max-w-xl` 컨테이너)을 유지한다 — 기존 `sm:` 외에 새로운 브레이크포인트를 추가하지 않는다.
- 모든 명령어는 저장소 루트(`/Users/user/workspace/AI SideProject_Wedding`)에서 실행한다.

---

### 태스크 1: 디자인 토큰 심화

**파일:**
- 수정: `tailwind.config.ts:11-38`
- 수정: `app/globals.css:9-12`

**인터페이스:**
- 산출물: `cream`, `ink`, `line`, `accent`, `sage`, `clay`의 새 hex 값과 새 토큰 `brass`(`brass.DEFAULT`, `brass.soft`) — 이후 모든 태스크에서 Tailwind 유틸리티 클래스(`bg-brass`, `text-brass`, `from-brass` 등)로 사용한다.

- [ ] **스텝 1: `tailwind.config.ts`의 colors 블록 교체**

11-38번 줄(`colors: { ... }` 블록)을 아래로 교체:

```ts
      colors: {
        cream: {
          DEFAULT: "#F7F2E7",
          soft: "#F1E9D8",
        },
        ink: {
          DEFAULT: "#241E17",
          soft: "#675D4E",
          faint: "#9C9285",
        },
        line: {
          DEFAULT: "#E5DCC8",
          soft: "#EEE6D4",
        },
        accent: {
          DEFAULT: "#9C4B2E",
          soft: "#F1DFC9",
          strong: "#7A3A22",
        },
        brass: {
          DEFAULT: "#A98953",
          soft: "#EFE6D3",
        },
        sage: {
          DEFAULT: "#6B8F71",
          soft: "#E4EBE3",
        },
        clay: {
          DEFAULT: "#B5574A",
          soft: "#F1E1DD",
        },
      },
```

- [ ] **스텝 2: `app/globals.css`의 하드코딩된 body 색상 맞추기**

9-12번 줄을 아래로 교체:

```css
body {
  background-color: #f7f2e7;
  color: #241e17;
}

::selection {
  background-color: #f1dfc9;
  color: #241e17;
}
```

- [ ] **스텝 3: 검증**

실행: `npx tsc --noEmit`
기대 결과: 에러 없음.

실행: (아직 안 띄웠다면) `npm run dev` 후 `http://localhost:3000` 접속.
기대 결과: 페이지 배경이 이전보다 살짝 더 짙은 웜 크림 톤이고, 본문 글자색은 더 깊은 잉크브라운이며, "모임 장소 찾아보기" 버튼과 테라코타 계열 강조색이 이전보다 파스텔감이 덜하고 더 진하게 보인다.

- [ ] **스텝 4: 커밋**

```bash
git add tailwind.config.ts app/globals.css
git commit -m "refine: deepen color tokens for a more editorial palette"
```

---

### 태스크 2: Pretendard 자체 호스팅 + Noto Serif KR

**파일:**
- 수정: `package.json` (`pretendard` 의존성 추가)
- 수정: `app/layout.tsx:1-34`
- 수정: `tailwind.config.ts:39-46`

**인터페이스:**
- 소비: 새로 소비하는 것 없음.
- 산출물: CSS 변수 `--font-pretendard`(본문/UI)와 `--font-noto-serif-kr`(디스플레이)을 Tailwind의 `font-sans`와 새 `font-serif` 유틸리티에 연결 — 태스크 4(Header), 태스크 5(PlaceCard), 태스크 6(랜딩 히어로), 태스크 8(장소 상세), 태스크 9(EmptyState)에서 사용한다.

- [ ] **스텝 1: Pretendard 설치**

실행: `npm install pretendard@^1.3.9`
기대 결과: `package.json`의 `dependencies`에 `pretendard`가 추가되고, `node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2` 파일이 존재한다.

- [ ] **스텝 2: `tailwind.config.ts`에 `serif` 폰트 패밀리 추가하고 `sans`를 Pretendard로 연결**

39-46번 줄(`fontFamily: { ... }` 블록)을 교체:

```ts
      fontFamily: {
        sans: [
          "var(--font-pretendard)",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        serif: [
          "var(--font-noto-serif-kr)",
          "Georgia",
          "serif",
        ],
      },
```

- [ ] **스텝 3: `app/layout.tsx`에서 두 폰트 로드**

파일 전체를 교체:

```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

const pretendard = localFont({
  src: "../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

const notoSerifKr = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-noto-serif-kr",
});

export const metadata: Metadata = {
  title: "청첩자리 — 청첩장 모임 장소 탐색",
  description:
    "관계와 모임 상황에 맞는 청첩장 모임 장소를 빠르게 찾고 저장할 수 있도록 돕는 장소 탐색 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${notoSerifKr.variable}`}
    >
      <body className="min-h-dvh bg-cream font-sans text-ink antialiased">
        <Providers>
          <Header />
          <main className="mx-auto max-w-xl px-5 pb-16 pt-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **스텝 4: 검증**

실행: `npx tsc --noEmit`
기대 결과: 에러 없음.

실행: `npm run dev` 후 `http://localhost:3000` 접속.
기대 결과: 본문 텍스트(문단, 버튼)가 Noto Sans KR에서 Pretendard로 눈에 띄게 바뀐다(더 촘촘하고 기하학적인 글자 형태, 숫자 모양이 확연히 다름). 아직 `font-serif`를 쓰는 곳이 없으므로 태스크 4/6 전까지 제목류는 그대로 보인다.

- [ ] **스텝 5: 커밋**

```bash
git add package.json package-lock.json tailwind.config.ts app/layout.tsx
git commit -m "feat: self-host Pretendard and add Noto Serif KR display font"
```

---

### 태스크 3: 버튼·태그 다듬기

**파일:**
- 수정: `components/ui/Button.tsx:7-14`
- 수정: `components/ui/Tag.tsx:6-11`

**인터페이스:**
- 소비: 새로 소비하는 것 없음.
- 산출물: 시그니처 변경 없음 — `Button`, `LinkButton`, `Tag`의 export/props는 이전과 동일.

- [ ] **스텝 1: `components/ui/Button.tsx`의 기본(primary) 버튼에 눌림 피드백과 그림자 추가**

7-14번 줄 교체:

```tsx
const base =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-3 text-sm font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-cream shadow-card hover:bg-ink/90",
  secondary: "bg-accent-soft text-accent-strong hover:bg-accent-soft/70",
  ghost: "bg-transparent text-ink-soft hover:bg-cream-soft",
};
```

- [ ] **스텝 2: `components/ui/Tag.tsx`의 neutral 변형을 좀 더 납작하게**

6-11번 줄 교체:

```tsx
const variants: Record<TagVariant, string> = {
  neutral: "bg-cream-soft text-ink-soft",
  accent: "bg-accent-soft text-accent-strong",
  warning: "bg-clay-soft text-clay",
  positive: "bg-sage-soft text-sage",
};
```

- [ ] **스텝 3: 검증**

실행: `npx tsc --noEmit`
기대 결과: 에러 없음.

실행: `npm run dev` 후 `http://localhost:3000/search`를 열고, 스텝 옵션과 "다음" 버튼을 눌러본다.
기대 결과: 버튼을 탭/클릭할 때 살짝 축소되는 피드백이 보이고, 기본 "다음" 버튼은 평소에도 은은한 그림자가 있다.

- [ ] **스텝 4: 커밋**

```bash
git add components/ui/Button.tsx components/ui/Tag.tsx
git commit -m "refine: add press feedback to buttons, flatten neutral tag"
```

---

### 태스크 4: 헤더 워드마크

**파일:**
- 수정: `components/Header.tsx:8-10`

**인터페이스:**
- 소비: 태스크 2의 `font-serif` 유틸리티.
- 산출물: prop/export 변경 없음.

- [ ] **스텝 1: 워드마크를 디스플레이 세리프로 설정**

8-10번 줄 교체:

```tsx
        <Link
          href="/"
          className="font-serif text-lg font-bold tracking-tight text-ink"
        >
          청첩자리
        </Link>
```

- [ ] **스텝 2: 검증**

실행: `npx tsc --noEmit`
기대 결과: 에러 없음.

실행: `npm run dev` 후 `http://localhost:3000` 접속.
기대 결과: 상단 고정 헤더의 "청첩자리" 워드마크가 세리프체로 렌더링되며, 옆의 "북마크함" 내비게이션 링크보다 크고 굵게 보인다.

- [ ] **스텝 3: 커밋**

```bash
git add components/Header.tsx
git commit -m "refine: set header wordmark in display serif"
```

---

### 태스크 5: `SealBadge` 컴포넌트 및 `PlaceCard` 재설계

**파일:**
- 생성: `components/ui/SealBadge.tsx`
- 수정: `lib/labels.ts:1-9` (import) 및 파일 끝(신규 export)
- 수정: `components/PlaceCard.tsx` (전체 파일)

**인터페이스:**
- 소비: `font-serif` 유틸리티(태스크 2), `brass` 토큰(태스크 1).
- 산출물:
  - `components/ui/SealBadge.tsx`의 `SealBadge({ score: number; label: string; variant: SealVariant; className?: string })` — 태스크 8(장소 상세 페이지)에서 사용.
  - `components/ui/SealBadge.tsx`의 `buildScallopPath(cx: number, cy: number, bumps: number, outerR: number, innerR: number): string` — 태스크 6(랜딩 히어로 워터마크)에서 사용.
  - `lib/labels.ts`의 `SealVariant` 타입과 `FIT_SEAL_VARIANT: Record<MatchResult["fitLabel"], SealVariant>` — 태스크 8에서 사용.

- [ ] **스텝 1: `lib/labels.ts`에 봉인 배지 변형 매핑 추가**

1-9번 줄(타입 import 블록)을 교체:

```ts
import type {
  AlcoholKey,
  AreaKey,
  AvoidKey,
  BudgetKey,
  MatchResult,
  MoodKey,
  PeopleKey,
  RelationshipKey,
} from "./types";
```

파일 맨 끝에 추가:

```ts

export type SealVariant = "positive" | "accent" | "neutral";

export const FIT_SEAL_VARIANT: Record<MatchResult["fitLabel"], SealVariant> = {
  "매우 적합": "positive",
  적합: "accent",
  보통: "neutral",
};
```

- [ ] **스텝 2: `components/ui/SealBadge.tsx` 생성**

```tsx
import { clsx } from "clsx";
import type { SealVariant } from "@/lib/labels";

export function buildScallopPath(
  cx: number,
  cy: number,
  bumps: number,
  outerR: number,
  innerR: number,
): string {
  const step = (Math.PI * 2) / (bumps * 2);
  const points: string[] = [];
  for (let i = 0; i <= bumps * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `${points.join(" ")} Z`;
}

const SCALLOP_PATH = buildScallopPath(24, 24, 14, 22, 18);

const VARIANT_STYLE: Record<
  SealVariant,
  { fill: string; stroke: string; text: string }
> = {
  positive: { fill: "fill-sage-soft", stroke: "stroke-sage", text: "text-sage" },
  accent: {
    fill: "fill-accent-soft",
    stroke: "stroke-accent",
    text: "text-accent-strong",
  },
  neutral: {
    fill: "fill-cream-soft",
    stroke: "stroke-ink-faint",
    text: "text-ink-soft",
  },
};

export function SealBadge({
  score,
  label,
  variant,
  className,
}: {
  score: number;
  label: string;
  variant: SealVariant;
  className?: string;
}) {
  const style = VARIANT_STYLE[variant];

  return (
    <div className={clsx("flex shrink-0 flex-col items-center gap-1", className)}>
      <svg viewBox="0 0 48 48" className="h-11 w-11" aria-hidden="true">
        <path d={SCALLOP_PATH} className={style.fill} />
        <path
          d={SCALLOP_PATH}
          className={style.stroke}
          fill="none"
          strokeWidth="1.5"
        />
        <text
          x="24"
          y="29"
          textAnchor="middle"
          className={clsx("font-serif text-[15px] font-bold", style.text)}
          fill="currentColor"
        >
          {score}
        </text>
      </svg>
      <span className={clsx("text-[10px] font-medium leading-none", style.text)}>
        {label}
      </span>
    </div>
  );
}
```

- [ ] **스텝 3: `components/PlaceCard.tsx`를 `SealBadge`와 헤어라인 구분선을 쓰도록 재설계**

파일 전체를 교체:

```tsx
"use client";

import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import { AREA_LABEL, FIT_SEAL_VARIANT, MOOD_LABEL, formatPrice } from "@/lib/labels";
import { conditionToSearchParams } from "@/lib/condition-query";
import { generateCardReason } from "@/lib/reason";
import type { Condition, MatchResult } from "@/lib/types";
import { Tag } from "@/components/ui/Tag";
import { SealBadge } from "@/components/ui/SealBadge";
import { BookmarkButton } from "@/components/BookmarkButton";
import { track } from "@/lib/analytics";

export function PlaceCard({
  match,
  condition,
  rank,
}: {
  match: MatchResult;
  condition: Condition;
  rank: number;
}) {
  const { place, score, matchedMoods, fitLabel } = match;
  const reason = generateCardReason(condition, match);
  const detailHref = `/places/${place.id}?${conditionToSearchParams(condition).toString()}`;

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-card">
      <div className="h-[3px] bg-gradient-to-r from-accent via-brass to-accent" />
      <div className="p-5">
        <div className="flex items-start gap-3.5">
          <SealBadge score={score} label={fitLabel} variant={FIT_SEAL_VARIANT[fitLabel]} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-serif text-base font-bold text-ink">
              {place.name}
            </h3>
            <p className="mt-0.5 text-xs text-ink-faint">
              {place.category} · {AREA_LABEL[place.area]} · 1인{" "}
              {formatPrice(place.priceMin, place.priceMax)}
            </p>
          </div>
        </div>

        <div className="mt-3.5 space-y-1 border-t border-line pt-3.5 text-sm text-ink-soft">
          <p className="font-medium text-ink">{reason.headline}</p>
          <p>{reason.strengthLine}</p>
          <p className="text-ink-faint">{reason.cautionLine}</p>
        </div>

        {matchedMoods.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {matchedMoods.map((m) => (
              <Tag key={m} variant="neutral">
                #{MOOD_LABEL[m]}
              </Tag>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={detailHref}
            onClick={() =>
              track("place_card_clicked", { place_id: place.id, rank, score })
            }
            className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-cream hover:bg-ink/90"
          >
            상세 보기
          </Link>
          <a
            href={place.mapUrlNaver}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              track("map_clicked", {
                place_id: place.id,
                rank,
                score,
                map_type: "naver",
              })
            }
            className="inline-flex items-center gap-1 rounded-full border border-line px-4 py-2.5 text-sm text-ink-soft hover:border-ink-faint"
          >
            <MapPin className="h-3.5 w-3.5" />
            지도 보기
            <ExternalLink className="h-3 w-3" />
          </a>
          <BookmarkButton placeId={place.id} rank={rank} score={score} page="results" />
        </div>
      </div>
    </article>
  );
}
```

- [ ] **스텝 4: 검증**

실행: `npx tsc --noEmit`
기대 결과: 에러 없음.

실행: `npm run dev` 후 `/search`를 거쳐 `/results`로 이동.
기대 결과: 각 결과 카드에 평범한 "매우 적합 · 92점" 필(pill) 대신, 장소명 왼쪽에 스캘럽 형태의 봉인 배지(세리프체 점수 숫자 포함)가 보인다. 카드 상단에는 테라코타→브라스 그라데이션의 얇은 선이 지나가고, 카드에는 테두리 없이 은은한 그림자만 남는다.

- [ ] **스텝 5: 커밋**

```bash
git add lib/labels.ts components/ui/SealBadge.tsx components/PlaceCard.tsx
git commit -m "feat: add SealBadge signature motif and redesign PlaceCard"
```

---

### 태스크 6: 랜딩 페이지 히어로

**파일:**
- 수정: `app/page.tsx` (전체 파일)

**인터페이스:**
- 소비: `components/ui/SealBadge.tsx`의 `buildScallopPath`(태스크 5), `font-serif`(태스크 2).
- 산출물: export 변경 없음 (여전히 `LandingPage`를 기본 export).

- [ ] **스텝 1: 파일 전체 교체**

```tsx
import { ArrowRight, MessageCircleHeart, ShieldCheck, Wallet } from "lucide-react";
import { SearchCta } from "@/components/SearchCta";
import { TrackOnMount } from "@/components/TrackOnMount";
import { buildScallopPath } from "@/components/ui/SealBadge";

const VALUE_POINTS = [
  {
    icon: MessageCircleHeart,
    title: "관계 중심 탐색",
    description: "친구, 동료, 선배, 가족 — 만나는 사람에 맞는 후보부터 좁혀드려요.",
  },
  {
    icon: ShieldCheck,
    title: "추천 이유와 확인할 점",
    description: "왜 적합한지, 예약·웨이팅 리스크는 없는지 함께 알려드려요.",
  },
  {
    icon: Wallet,
    title: "부담 없는 예산 매칭",
    description: "1인 예산과 대접감 사이, 딱 맞는 지점을 찾아드려요.",
  },
];

const HERO_SEAL_PATH = buildScallopPath(100, 100, 16, 96, 82);

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-10">
      <TrackOnMount event="landing_viewed" props={{ source: "direct" }} />

      <section className="relative pt-6 text-center">
        <svg
          viewBox="0 0 200 200"
          className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 text-accent/10"
          aria-hidden="true"
        >
          <path d={HERO_SEAL_PATH} fill="currentColor" />
        </svg>

        <div className="relative">
          <p className="text-sm font-medium text-accent-strong">청첩자리</p>
          <h1 className="mt-3 font-serif text-2xl font-bold leading-snug text-ink sm:text-3xl">
            청첩장 모임,
            <br />
            어디서 해야 덜 고민될까요?
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
            만나는 사람, 예산, 분위기, 피하고 싶은 조건을 기준으로 청첩장
            모임에 맞는 장소를 찾아보세요.
          </p>

          <SearchCta
            source="landing"
            className="mt-7 inline-flex items-center gap-1.5 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream shadow-card transition-colors hover:bg-ink/90"
          >
            모임 장소 찾아보기
            <ArrowRight className="h-4 w-4" />
          </SearchCta>
        </div>
      </section>

      <section className="divide-y divide-line border-y border-line">
        {VALUE_POINTS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex items-start gap-3 py-4">
            <div className="rounded-full bg-accent-soft p-2 text-accent-strong">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{description}</p>
            </div>
          </div>
        ))}
      </section>

      <p className="text-center text-xs text-ink-faint">
        지금은 강남역 · 신논현 · 논현 인근 장소를 중심으로 서비스하고 있어요.
      </p>
    </div>
  );
}
```

- [ ] **스텝 2: 검증**

실행: `npx tsc --noEmit`
기대 결과: 에러 없음.

실행: `npm run dev` 후 `http://localhost:3000` 접속.
기대 결과: 히어로 헤드라인 뒤로 아주 은은한 대형 스캘럽 원 워터마크가 보이고, 헤드라인 자체는 세리프체로 렌더링된다. 세 개의 가치 포인트는 각각 흰 박스가 아니라, 위아래 가로선 사이에 헤어라인으로 구분된 리스트 형태로 보인다.

- [ ] **스텝 3: 커밋**

```bash
git add app/page.tsx
git commit -m "refine: redesign landing hero with serif headline and seal watermark"
```

---

### 태스크 7: 결과 페이지 조건 요약

**파일:**
- 수정: `app/results/page.tsx:39-48`

**인터페이스:**
- 소비: `font-serif`(태스크 2).
- 산출물: export 변경 없음.

- [ ] **스텝 1: 박스형 조건 요약을 하단 헤어라인 행으로 교체**

39-48번 줄 교체:

```tsx
      <div className="flex items-start justify-between gap-3 border-b border-line pb-4">
        <div className="text-sm text-ink-soft">
          <p className="font-serif font-semibold text-ink">
            {RELATIONSHIP_LABEL[condition.relationship]} · {PEOPLE_LABEL[condition.people]} ·{" "}
            {BUDGET_LABEL[condition.budget]}
          </p>
          <p className="mt-0.5 text-xs text-ink-faint">{AREA_LABEL[condition.area]} 기준</p>
        </div>
        <EditConditionLink resultCount={matches.length} />
      </div>
```

- [ ] **스텝 2: 검증**

실행: `npx tsc --noEmit`
기대 결과: 에러 없음.

실행: `npm run dev` 후 `/search`를 거쳐 `/results`로 이동.
기대 결과: 결과 목록 상단의 조건 요약이 흰 박스/테두리 없이 밑줄(헤어라인)만 있는 평범한 행으로 보이고, 요약 텍스트가 세리프체로 표시된다.

- [ ] **스텝 3: 커밋**

```bash
git add app/results/page.tsx
git commit -m "refine: replace boxed condition summary with hairline row"
```

---

### 태스크 8: 장소 상세 페이지

**파일:**
- 수정: `app/places/[id]/page.tsx` (전체 파일)

**인터페이스:**
- 소비: `SealBadge`, `FIT_SEAL_VARIANT`(태스크 5), `font-serif`(태스크 2).
- 산출물: export 변경 없음.

- [ ] **스텝 1: 파일 전체 교체**

```tsx
import { notFound } from "next/navigation";
import { getPlaceById } from "@/lib/places";
import { searchParamsToCondition } from "@/lib/condition-query";
import { scorePlace } from "@/lib/scoring";
import { generateDetailReason, genericReason } from "@/lib/reason";
import { buildCheckpoints } from "@/lib/checkpoints";
import { AREA_LABEL, FIT_SEAL_VARIANT, formatPrice } from "@/lib/labels";
import { CheckpointList } from "@/components/CheckpointList";
import { MapLinks } from "@/components/MapLinks";
import { BookmarkButton } from "@/components/BookmarkButton";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { TrackOnMount } from "@/components/TrackOnMount";
import { SealBadge } from "@/components/ui/SealBadge";

export default async function PlaceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const place = getPlaceById(id);
  if (!place) notFound();

  const sp = await searchParams;
  const condition = searchParamsToCondition(sp);
  const match = condition ? scorePlace(condition, place) : null;
  const reason = match
    ? generateDetailReason(condition!, match)
    : genericReason(place.curatedReason);
  const checkpoints = buildCheckpoints(place, condition);

  return (
    <div className="flex flex-col gap-6">
      <TrackOnMount
        event="place_detail_viewed"
        props={{ place_id: place.id, score: match?.score }}
      />

      <div className="flex items-start gap-3.5">
        {match && (
          <SealBadge
            score={match.score}
            label={match.fitLabel}
            variant={FIT_SEAL_VARIANT[match.fitLabel]}
          />
        )}
        <div className="min-w-0">
          <h1 className="font-serif text-xl font-bold text-ink">{place.name}</h1>
          <p className="mt-1 text-sm text-ink-faint">
            {place.category} · {AREA_LABEL[place.area]} · {place.address}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            1인 {formatPrice(place.priceMin, place.priceMax)}
          </p>
        </div>
      </div>

      <section className="border-t border-accent/40 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-strong">
          이 모임에 추천하는 이유
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink">{reason}</p>
      </section>

      <section>
        <p className="mb-2.5 text-sm font-semibold text-ink">청첩장 모임 체크포인트</p>
        <CheckpointList checkpoints={checkpoints} />
      </section>

      <section className="border-t border-clay/40 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-clay">주의할 점</p>
        <p className="mt-1.5 text-sm text-ink">{place.cautionNote}</p>
      </section>

      <section>
        <p className="mb-2 text-xs text-ink-faint">
          리뷰, 영업시간, 메뉴, 예약 가능 여부는 지도 서비스에서 최신 정보를
          확인해주세요. (정보 확인일 {place.lastVerifiedAt})
        </p>
        <MapLinks
          placeId={place.id}
          mapUrlNaver={place.mapUrlNaver}
          mapUrlKakao={place.mapUrlKakao}
          score={match?.score}
        />
      </section>

      <BookmarkButton
        placeId={place.id}
        page="detail"
        score={match?.score}
        labeled
        className="w-full justify-center py-3"
      />

      <FeedbackWidget placeId={place.id} />
    </div>
  );
}
```

- [ ] **스텝 2: 검증**

실행: `npx tsc --noEmit`
기대 결과: 에러 없음.

실행: `npm run dev` 후 `/search` → `/results` → 한 장소의 "상세 보기"로 이동.
기대 결과: 장소명이 세리프체로 표시되고 그 왼쪽에 봉인 배지가 보인다(결과 카드와 동일한 모티프). "추천하는 이유"와 "주의할 점" 섹션은 더 이상 색이 있는 박스가 아니라, 상단에 헤어라인과 대문자 라벨이 있는 평범한 섹션으로 보인다.

- [ ] **스텝 3: 커밋**

```bash
git add "app/places/[id]/page.tsx"
git commit -m "refine: redesign place detail page with SealBadge and hairline sections"
```

---

### 태스크 9: 북마크 페이지와 `EmptyState`

**파일:**
- 수정: `components/ui/EmptyState.tsx:13-14`
- 수정: `app/bookmarks/page.tsx` (전체 파일)

**인터페이스:**
- 소비: `font-serif`(태스크 2).
- 산출물: export/props 변경 없음.

- [ ] **스텝 1: `components/ui/EmptyState.tsx`의 빈 상태 컨테이너 스타일 변경**

13-14번 줄 교체:

```tsx
    <div className="flex flex-col items-center gap-3 border-t border-line px-6 py-14 text-center">
      <p className="font-serif text-base font-semibold text-ink">{title}</p>
```

- [ ] **스텝 2: `PlaceCard`와 스타일을 맞추도록 `app/bookmarks/page.tsx` 전체 파일 교체**

```tsx
"use client";

import Link from "next/link";
import { Bookmark, ExternalLink, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { getBookmarkIds, toggleBookmark } from "@/lib/bookmarks";
import { getPlaceById } from "@/lib/places";
import { AREA_LABEL, formatPrice } from "@/lib/labels";
import { track } from "@/lib/analytics";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Place } from "@/lib/types";

export default function BookmarksPage() {
  const [places, setPlaces] = useState<Place[] | null>(null);

  useEffect(() => {
    const ids = getBookmarkIds();
    const found = ids.map(getPlaceById).filter((p): p is Place => Boolean(p));
    setPlaces(found);
    track("bookmark_list_viewed", { bookmark_count: found.length });
  }, []);

  function handleRemove(placeId: string) {
    toggleBookmark(placeId);
    setPlaces((prev) => (prev ? prev.filter((p) => p.id !== placeId) : prev));
  }

  if (places === null) {
    return <p className="py-14 text-center text-sm text-ink-faint">불러오는 중이에요…</p>;
  }

  if (places.length === 0) {
    return (
      <EmptyState
        title="아직 저장한 장소가 없어요."
        description={"마음에 드는 장소를 저장해두고\n다시 비교해보세요."}
        action={
          <Link
            href="/search"
            className="mt-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-cream hover:bg-ink/90"
          >
            모임 장소 찾아보기
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-serif text-lg font-semibold text-ink">저장한 장소 {places.length}곳</h1>

      {places.map((place) => (
        <article
          key={place.id}
          className="overflow-hidden rounded-2xl bg-white shadow-card"
        >
          <div className="h-[3px] bg-gradient-to-r from-accent via-brass to-accent" />
          <div className="p-5">
            <h3 className="font-serif text-base font-bold text-ink">{place.name}</h3>
            <p className="mt-1 text-xs text-ink-faint">
              {place.category} · {AREA_LABEL[place.area]} · 1인{" "}
              {formatPrice(place.priceMin, place.priceMax)}
            </p>
            <p className="mt-2.5 text-sm text-ink-soft">{place.curatedReason}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                href={`/places/${place.id}`}
                className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-cream hover:bg-ink/90"
              >
                상세 보기
              </Link>
              <a
                href={place.mapUrlNaver}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  track("map_clicked", { place_id: place.id, map_type: "naver" })
                }
                className="inline-flex items-center gap-1 rounded-full border border-line px-4 py-2.5 text-sm text-ink-soft hover:border-ink-faint"
              >
                <MapPin className="h-3.5 w-3.5" />
                지도 보기
                <ExternalLink className="h-3 w-3" />
              </a>
              <button
                type="button"
                onClick={() => handleRemove(place.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent-soft px-3.5 py-2 text-sm font-medium text-accent-strong"
              >
                <Bookmark className="h-4 w-4" fill="currentColor" />
                저장 해제
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
```

- [ ] **스텝 3: 검증**

실행: `npx tsc --noEmit`
기대 결과: 에러 없음.

실행: `npm run dev` 후 `/results`에서 장소를 하나 북마크하고, `http://localhost:3000/bookmarks`를 연다.
기대 결과: 북마크 카드에 결과 카드와 동일한 테라코타→브라스 상단 라인이 보이고 장소명이 세리프체로 표시된다. 빈 상태(저장한 장소가 없는 상태에서 `/bookmarks` 접속)는 점선 박스 대신 상단에 헤어라인만 있는 평범한 블록으로 보인다.

- [ ] **스텝 4: 커밋**

```bash
git add components/ui/EmptyState.tsx app/bookmarks/page.tsx
git commit -m "refine: align bookmarks page and empty state with the new visual language"
```

---

## 범위 밖 (자동으로 리프레시가 적용되어 별도 태스크가 필요 없음)

`components/BookmarkButton.tsx`, `components/MapLinks.tsx`, `components/CheckpointList.tsx`, `components/FeedbackWidget.tsx`, `components/EditConditionLink.tsx`, `app/search/page.tsx`, `app/not-found.tsx`는 기존 토큰 클래스(`border-line`, `bg-white`, `text-ink-soft`, `bg-accent-soft` 등)와 Noto Sans에서 Pretendard로 바뀐 본문 폰트만 참조하고 있어서, 코드 수정 없이도 태스크 1·2에서 나온 더 짙은 팔레트와 새 본문 폰트를 그대로 적용받는다. 태스크 1~9가 실제로 적용된 화면을 본 뒤에도 이 컴포넌트들이 어색해 보인다면, 그때 후속 작업으로 다시 다뤄도 된다.
