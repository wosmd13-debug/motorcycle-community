import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import NavigationScrollReset from "@/components/portal/NavigationScrollReset";
import RegisterWelcomeModal from "@/components/auth/RegisterWelcomeModal";
import { AuthProvider } from "@/components/auth/AuthProvider";
import ThemeInitScript from "@/components/theme/ThemeInitScript";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { getCurrentUser } from "@/lib/auth-server";
import { siteLegalInfo } from "@/lib/site-legal";
import "./globals.css";

const notoSans = Noto_Sans_KR({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const siteUrl = siteLegalInfo.siteUrl.replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "바이크커뮤니티 — 오토바이 라이더 커뮤니티",
    template: "%s | 바이크커뮤니티",
  },
  description:
    "오토바이를 취미로 타는 라이더들을 위한 커뮤니티. 자유게시판, 라이딩 지도, 갤러리, 날씨 정보를 한곳에서.",
  applicationName: siteLegalInfo.serviceName,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName: siteLegalInfo.serviceName,
    title: "바이크커뮤니티 — 오토바이 라이더 커뮤니티",
    description:
      "오토바이를 취미로 타는 라이더들을 위한 커뮤니티. 자유게시판, 라이딩 지도, 갤러리, 날씨 정보를 한곳에서.",
  },
  twitter: {
    card: "summary_large_image",
    title: "바이크커뮤니티 — 오토바이 라이더 커뮤니티",
    description:
      "오토바이를 취미로 타는 라이더들을 위한 커뮤니티. 자유게시판, 라이딩 지도, 갤러리, 날씨 정보를 한곳에서.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await getCurrentUser();

  return (
    <html
      lang="ko"
      className={`${notoSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeInitScript />
        <ThemeProvider>
          <AuthProvider initialUser={initialUser}>
            <NavigationScrollReset />
            <RegisterWelcomeModal />
            <Header />
            <main className="flex min-w-0 w-full flex-1 flex-col overflow-x-clip">{children}</main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
