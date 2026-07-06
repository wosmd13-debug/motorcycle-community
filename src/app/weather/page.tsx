import PageHeader from "@/components/PageHeader";
import WeatherDashboard from "@/components/weather/WeatherDashboard";

export default function WeatherPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        emoji="☀️"
        title="라이딩 날씨"
        description="출발 전 기온, 바람, 강수 정보를 확인하고 안전하게 라이딩하세요."
      />

      <WeatherDashboard />
    </div>
  );
}
