import Link from "next/link";
import {
  formatWeatherUpdated,
  goNoGoLabel,
} from "@/lib/weather";
import { fetchWeather } from "@/lib/weather-service";

type WeatherPreviewProps = {
  compact?: boolean;
};

export default async function WeatherPreview({ compact = false }: WeatherPreviewProps) {
  const result = await fetchWeather({ city: "Seoul,KR", fresh: true });

  if (compact) {
    return (
      <section className="portal-panel overflow-hidden">
        <div className="portal-panel-head">
          <h2 className="portal-panel-title">오늘의 날씨</h2>
          <Link href="/weather" className="portal-panel-more">
            상세
          </Link>
        </div>
        <div className="bg-signature-light/30 p-3">
          {result.ok ? (
            <>
              <p className="text-xs text-stone-500">{result.data.current.location}</p>
              <p className="mt-1 text-2xl font-bold text-signature">
                {result.data.current.temperature}°C
              </p>
              <p className="mt-1 text-sm text-slate-600">{result.data.current.condition}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {result.ok
                  ? `${goNoGoLabel(result.data.current.goNoGo.verdict)} · ${result.data.current.ridingTip}`
                  : ""}
              </p>
              <p className="mt-2 text-[11px] text-slate-400">
                {formatWeatherUpdated(result.data.updatedAt)} 기준
              </p>
            </>
          ) : (
          <p className="text-xs leading-5 text-slate-500">
            날씨 정보를 불러오지 못했습니다.
          </p>
        )}
        </div>
      </section>
    );
  }

  return (
    <section className="portal-panel overflow-hidden">
      <div className="portal-panel-head">
        <h2 className="portal-panel-title">오늘의 라이딩 날씨</h2>
        <Link href="/weather" className="portal-panel-more">
          자세히 보기
        </Link>
      </div>
      <div className="p-4">
        {result.ok ? (
          <>
            <p className="text-sm text-slate-500">{result.data.current.location}</p>
            <p className="mt-2 text-3xl font-bold text-signature">
              {result.data.current.temperature}°C
            </p>
            <p className="mt-1 text-slate-600">{result.data.current.condition}</p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {result.data.current.ridingTip}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {result.data.provider === "openweathermap"
                ? "OpenWeatherMap"
                : "Open-Meteo"}{" "}
              · {formatWeatherUpdated(result.data.updatedAt)} 기준
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-600">{result.error}</p>
        )}
      </div>
    </section>
  );
}

export function WeatherPreviewSkeleton() {
  return (
    <section className="portal-panel animate-pulse">
      <div className="portal-panel-head">
        <div className="h-4 w-24 rounded bg-slate-200" />
      </div>
      <div className="space-y-2 p-3">
        <div className="h-3 w-16 rounded bg-slate-100" />
        <div className="h-8 w-20 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-100" />
      </div>
    </section>
  );
}
