import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
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
    <html lang="ko" className={notoSansKr.variable}>
      <body className="min-h-dvh bg-cream font-sans text-ink antialiased">
        <Providers>
          <Header />
          <main className="mx-auto max-w-xl px-5 pb-16 pt-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
