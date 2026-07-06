"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ridingCities,
  ridingScoreColor,
  ridingScoreLabel,
  type WeatherResponse,
} from "@/lib/weather";

const DEFAULT_CITY = ridingCities[0];

export default function WeatherDashboard() {
  const [selectedCity, setSelectedCity] = useState(DEFAULT_CITY);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingLocation, setUsingLocation] = useState(false);

  const loadWeather = useCallback(async (params: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/weather?${params}`);
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
    void loadWeather(`city=${encodeURIComponent(selectedCity.query)}`);
  }, [selectedCity, loadWeather]);

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
      <div className="mt-8 rounded-3xl border border-dashed border-orange-200 bg-orange-50/60 px-6 py-12 text-center">
        <p className="text-4xl">🌦️</p>
        <h2 className="mt-4 text-lg font-bold text-slate-800">
          날씨 정보를 불러올 수 없습니다
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
        {error.includes("OPENWEATHERMAP") && (
          <pre className="mx-auto mt-4 max-w-md rounded-2xl bg-white px-4 py-3 text-left text-xs text-slate-700 shadow-sm">
            OPENWEATHERMAP_API_KEY=발급받은_API_키
          </pre>
        )}
        <a
          href="https://openweathermap.org/api"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-semibold text-orange-500 hover:underline"
        >
          OpenWeatherMap API 키 발급 →
        </a>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
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
                    ? "bg-orange-500 text-white"
                    : "bg-orange-50 text-slate-600 ring-1 ring-orange-100 hover:bg-orange-100"
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
            {usingLocation ? "위치 확인 중..." : "📍 내 위치"}
          </button>
        </div>
      </div>

      {loading && !weather ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-orange-100 bg-orange-50 text-sm text-slate-500">
          날씨 불러오는 중...
        </div>
      ) : weather ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-sm font-semibold text-orange-500">
                {weather.current.location} 현재 날씨
              </p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${ridingScoreColor(weather.current.ridingScore)}`}
              >
                {ridingScoreLabel(weather.current.ridingScore)}
              </span>
            </div>

            <div className="mt-4 flex items-end gap-4">
              <span className="text-5xl">{weather.current.emoji}</span>
              <div>
                <p className="text-6xl font-bold text-slate-800">
                  {weather.current.temperature}°
                </p>
                <p className="text-sm text-slate-500">
                  체감 {weather.current.feelsLike}°
                </p>
              </div>
            </div>
            <p className="mt-2 text-xl capitalize text-slate-600">
              {weather.current.condition}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <WeatherStat label="바람" value={weather.current.wind} />
              <WeatherStat label="습도" value={weather.current.humidity} />
              <WeatherStat label="가시거리" value={weather.current.visibility} />
              <WeatherStat
                label="강수 확률"
                value={`${weather.forecast[0]?.pop ?? 0}%`}
              />
            </div>

            <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
              <strong>라이딩 팁:</strong> {weather.current.ridingTip}
            </div>
          </section>

          <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">5일 예보</h2>
            <div className="mt-4 space-y-3">
              {weather.forecast.map((day) => (
                <div
                  key={day.day}
                  className="flex items-center justify-between rounded-2xl bg-orange-50/70 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{day.emoji}</span>
                    <div>
                      <p className="font-semibold text-slate-800">{day.day}</p>
                      <p className="text-xs text-slate-500">{day.note}</p>
                    </div>
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
    <div className="rounded-2xl bg-orange-50 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  );
}
