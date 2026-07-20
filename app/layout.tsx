import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "청모픽 — 청첩장 모임 장소 추천",
  description: "분위기부터 예산까지, 청모에 맞게 픽",
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
