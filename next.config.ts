import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // VPS/Docker 단일 프로세스 배포용
  output: "standalone",
  reactStrictMode: false,
  ...(process.env.NODE_ENV === "development"
    ? {
        // 같은 Wi-Fi 휴대폰/태블릿 개발 접속용 (운영 빌드에는 포함되지 않음)
        allowedDevOrigins: ["192.168.0.22"],
      }
    : {}),
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
};

export default nextConfig;
