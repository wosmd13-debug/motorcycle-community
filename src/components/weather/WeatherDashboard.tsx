"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  factorStatusColor,
  factorStatusIcon,
  formatWeatherUpdated,
  goNoGoColor,
  goNoGoLabel,
  ridingCities,
  ridingScoreColor,
  type RidingCity,
  type WeatherResponse,
} from "@/lib/weather";

const DEFAULT_CITY = ridingCities[0];

type WeatherDashboardProps = {
  initialWeather?: WeatherResponse | null;
  initialError?: string | null;
};

export default function WeatherDashboard({
  initialWeather = null,
  initialError = null,
}: WeatherDashboardProps) {
  const [selectedCity, setSelectedCity] = useState(DEFAULT_CITY);
  const [weather, setWeather] = useState<WeatherResponse | null>(initialWeather);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [usingLocation, setUsingLocation] = useState(false);
  const skipInitialFetch = useRef(Boolean(initialWeather));

  const buildParams = (city: RidingCity) =>
    `city=${encodeURIComponent(city.query)}`;

  const loadWeather = useCallback(async (params: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/weather?${params}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "날씨 정보를 불러오지 못했습니다.");
      }

      setWeather(data as WeatherResponse);
    } catch (err) {
      setWeather(null);
      setError(
        err instanceof Error ? err.message : "날씨 정보를 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (skipInitialFetch.current && selectedCity.id === DEFAULT_CITY.id) {
      skipInitialFetch.current = false;
      return;
    }

    void loadWeather(`city=${encodeURIComponent(selectedCity.query)}`);
  }, [selectedCity, loadWeather]);

  const handleRefresh = () => {
    void loadWeather(buildParams(selectedCity));
  };

  const handleRetry = () => {
    void loadWeather(buildParams(DEFAULT_CITY));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError("이 브라우저에서는 위치 정보를 사용할 수 없습니다.");
      return;
    }

    setUsingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void loadWeather(
          `lat=${position.coords.latitude}&lon=${position.coords.longitude}`
        );
        setUsingLocation(false);
      },
      () => {
        setUsingLocation(false);
        setError("위치 정보를 가져오지 못했습니다. 도시를 직접 선택해 주세요.");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  if (error && !weather) {
    return (
      <div className="mt-8 rounded-3xl border border-dashed border-signature/30 bg-signature-light/60 px-6 py-12 text-center">
        <h2 className="text-lg font-bold text-slate-800">
          날씨 정보를 불러올 수 없습니다
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-5 rounded-full bg-signature-dark px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-signature-darker"
        >
          다시 시도
        </button>
        {error.includes("API 키") && (
          <pre className="mx-auto mt-4 max-w-md rounded-2xl bg-white px-4 py-3 text-left text-xs text-slate-700 shadow-sm">
            OPENWEATHERMAP_API_KEY=발급받은_API_키
          </pre>
        )}
        <a
          href="https://openweathermap.org/api"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-semibold text-signature-dark hover:underline"
        >
          OpenWeatherMap API 키 발급 →
        </a>
      </div>
    );
  }

  const goNoGo = weather?.current.goNoGo;

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-3xl border border-signature/20 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold text-slate-700">지역 선택</p>
          <div className="flex flex-wrap gap-2">
            {ridingCities.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  selectedCity.id === city.id
                    ? "bg-signature-dark text-white"
                    : "bg-signature-light text-slate-600 ring-1 ring-signature/20 hover:bg-signature-muted"
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={usingLocation || loading}
            className="rounded-full bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {usingLocation ? "위치 확인 중..." : "내 위치"}
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="rounded-full bg-signature-dark px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-signature-darker disabled:opacity-60"
          >
            {loading ? "새로고침 중..." : "새로고침"}
          </button>
        </div>
      </div>

      {loading && weather ? (
        <p className="text-center text-xs text-slate-500">최신 날씨 불러오는 중...</p>
      ) : null}

      {loading && !weather ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-signature/20 bg-signature-light text-sm text-slate-500">
          날씨 불러오는 중...
        </div>
      ) : weather && goNoGo ? (
        <>
          <section
            className={`rounded-3xl p-6 shadow-sm sm:p-8 ${goNoGoColor(goNoGo.verdict)}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold opacity-90">
                  {weather.current.location} · 라이딩 GO/NO-GO
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  {goNoGo.headline}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 opacity-95">
                  {goNoGo.summary}
                </p>
              </div>
              <span className="rounded-2xl bg-white/20 px-5 py-3 text-2xl font-black backdrop-blur-sm">
                {goNoGoLabel(goNoGo.verdict)}
              </span>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <section className="rounded-3xl border border-signature/20 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-signature-dark">
                    {weather.current.location} 현재 날씨
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    OpenWeatherMap · {formatWeatherUpdated(weather.updatedAt)} 기준
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-6xl font-bold text-slate-800">
                  {weather.current.temperature}°
                </p>
                <p className="text-sm text-slate-500">
                  체감 {weather.current.feelsLike}° · {weather.current.condition}
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <WeatherStat label="바람" value={weather.current.wind} />
                <WeatherStat label="강수 확률" value={`${weather.current.pop}%`} />
                <WeatherStat label="습도" value={weather.current.humidity} />
                <WeatherStat label="가시거리" value={weather.current.visibility} />
                <WeatherStat
                  label="미세먼지"
                  value={
                    weather.current.pm25 != null
                      ? `${weather.current.airQualityLabel} (PM2.5 ${weather.current.pm25})`
                      : weather.current.airQualityLabel
                  }
                />
                <WeatherStat label="일몰" value={weather.current.sunset} />
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-bold text-slate-800">판단 근거</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {goNoGo.factors.map((factor) => (
                    <div
                      key={factor.id}
                      className={`rounded-2xl border px-4 py-3 ${factorStatusColor(factor.status)}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold">{factor.label}</p>
                        <span className="text-sm font-black">
                          {factorStatusIcon(factor.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold">{factor.value}</p>
                      <p className="mt-1 text-[11px] leading-5 opacity-90">
                        {factor.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="space-y-6">
              <section className="rounded-3xl border border-signature/20 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800">앞으로 6시간</h2>
                <p className="mt-1 text-xs text-slate-500">
                  시간대별 강수·기온 요약
                </p>
                <div className="mt-4 space-y-2">
                  {weather.hourly.map((hour) => (
                    <div
                      key={hour.time}
                      className="flex items-center justify-between rounded-2xl bg-signature-light/70 px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{hour.time}</p>
                        <p className="text-xs capitalize text-slate-500">
                          {hour.condition}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-700">{hour.temp}°</p>
                        <p className="text-xs text-slate-500">강수 {hour.pop}%</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ridingScoreColor(hour.score)}`}
                      >
                        {hour.score === "good"
                          ? "OK"
                          : hour.score === "caution"
                            ? "주의"
                            : "X"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-signature/20 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800">5일 예보</h2>
                <div className="mt-4 space-y-3">
                  {weather.forecast.map((day) => (
                    <div
                      key={day.day}
                      className="flex items-center justify-between rounded-2xl bg-signature-light/70 px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{day.day}</p>
                        <p className="text-xs text-slate-500">{day.note}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-700">
                          {day.high}° / {day.low}°
                        </p>
                        <p className="text-xs text-slate-500">강수 {day.pop}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </>
      ) : null}

      {error && weather && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </p>
      )}
    </div>
  );
}

function WeatherStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-signature-light px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  );
}
