import PageHeader from "@/components/PageHeader";
import WeatherDashboard from "@/components/weather/WeatherDashboard";
import { fetchWeather } from "@/lib/weather-service";

export const dynamic = "force-dynamic";

export default async function WeatherPage() {
  const result = await fetchWeather({ city: "Seoul,KR", fresh: true });

  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
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
