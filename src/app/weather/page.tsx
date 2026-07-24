import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import SiteBreadcrumbs from "@/components/seo/SiteBreadcrumbs";
import WeatherDashboard from "@/components/weather/WeatherDashboard";
import { buildPageMetadata } from "@/lib/seo";
import { fetchWeather } from "@/lib/weather-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "라이딩 날씨",
  description:
    "오토바이 라이딩 전 GO/NO-GO 날씨. 강수·바람·체감온도·미세먼지·일몰을 Byanra에서 확인하세요.",
  path: "/weather",
  keywords: ["라이딩 날씨", "오토바이 날씨", "바이크 기상"],
});

export default async function WeatherPage() {
  const result = await fetchWeather({ city: "Seoul,KR", fresh: true });

  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <SiteBreadcrumbs
          items={[
            { name: "홈", href: "/" },
            { name: "날씨" },
          ]}
        />
        <PageHeader
          title="라이딩 날씨"
          description="출발 전 GO/NO-GO 판단 — 강수, 바람, 체감온도, 미세먼지, 일몰까지 한눈에 확인하세요."
        />

        <WeatherDashboard
          initialWeather={result.ok ? result.data : null}
          initialError={result.ok ? null : result.error}
        />
      </div>
    </div>
  );
}
