import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MainArea } from "@/components/MainArea";

// 쏘카프레임 2.0은 서체 페어링 없이 Pretendard Variable 하나로 못박는 하드 룰이다.
// 이전엔 홈 히어로에만 별도 세리프(고운바탕)를 얹었지만, 이번 리스킨에서 제거하고
// 앱 전체를 단일 패밀리로 통일한다.
const pretendard = localFont({
  src: "../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

// 카카오톡 등 메신저 링크 미리보기는 og:title/og:description/og:image를 따로 본다 —
// 이 필드들이 없으니 og:description은 카카오톡 자체 기본 문구("여기를 눌러...")로,
// og:image는 페이지에서 발견한 첫 <img>(예전 로고 logo.png)를 임의로 집어써서 지금 세션
// 리브랜딩과 안 맞는 이미지가 계속 떴다 — openGraph 필드를 명시해서 히어로 배너 일러스트를
// 확실한 공유 썸네일로 고정한다. metadataBase가 있어야 상대 경로(/hero-banner.png)가
// 절대 URL로 정확히 변환된다
export const metadata: Metadata = {
  metadataBase: new URL("https://w-restaurant.vercel.app"),
  title: "청모픽 — 청첩장 모임 장소 추천",
  description: "분위기부터 예산까지, 청모에 맞게 픽",
  openGraph: {
    title: "청모픽 — 청첩장 모임 장소 추천",
    description: "분위기부터 예산까지, 청모에 맞게 픽",
    images: [{ url: "/hero-banner.png", width: 708, height: 517, alt: "청첩장이 담긴 봉투 일러스트" }],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "청모픽 — 청첩장 모임 장소 추천",
    description: "분위기부터 예산까지, 청모에 맞게 픽",
    images: ["/hero-banner.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={pretendard.variable}>
      {/*
        모바일임을 드러내야 하는 건 가로 폭뿐이다. 세로는 웹사이트답게 항상 브라우저 높이를
        그대로 채우고, 특정 높이로 카드처럼 가두지 않는다 — 위아래 레터박스가 생기면 안 된다.
        폭은 max-w로 잡혀 있어 브라우저 폭이 바뀌는 대로 반응형으로 따라간다: 좁은 화면에선
        꽉 차게, 넓은 화면에선 가운데 고정폭(430px)에 좌우로만 스튜디오 배경이 보인다.
      */}
      <body className="min-h-dvh bg-studio font-sans text-ink antialiased">
        {/* Contentsquare 세션 리플레이. defer 속성 그대로 raw <script> 태그로 넣는 대신
            next/script의 afterInteractive 전략을 쓴다 — 페이지가 인터랙티브해진 뒤에
            로드돼서 초기 렌더링을 막지 않으면서도 defer와 동일한 효과를 낸다 */}
        <Script src="https://t.contentsquare.net/uxa/58e34a59df7cd.js" strategy="afterInteractive" />
        <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-cream">
          <Providers>
            <Header />
            <MainArea>{children}</MainArea>
            <BottomNav />
          </Providers>
        </div>
      </body>
    </html>
  );
}
