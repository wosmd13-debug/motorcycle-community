import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { NaverMapsProvider } from "@/components/map/NaverMapsProvider";
import { USE_NAVER_MAP } from "@/lib/map-config";
import "./globals.css";

const notoSans = Noto_Sans_KR({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "라이더모임 — 오토바이 라이더 커뮤니티",
  description:
    "오토바이를 취미로 타는 라이더들을 위한 커뮤니티. 게시판, 라이딩 지도, 갤러리, 날씨 정보를 한곳에서.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );

  return (
    <html lang="ko" className={`${notoSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {USE_NAVER_MAP ? (
          <NaverMapsProvider>{content}</NaverMapsProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}
