"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { WeatherResponse } from "@/lib/weather";

export default function WeatherPreview() {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/weather?city=Seoul%2CKR")
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<WeatherResponse>;
      })
      .then((data) => setWeather(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800">☀️ 오늘의 라이딩 날씨</h2>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">날씨 불러오는 중...</p>
      ) : weather ? (
        <>
          <p className="mt-1 text-sm text-orange-500">{weather.current.location}</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-3xl">{weather.current.emoji}</span>
            <p className="text-3xl font-bold text-orange-500">
              {weather.current.temperature}°C
            </p>
          </div>
          <p className="mt-1 capitalize text-slate-600">{weather.current.condition}</p>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            {weather.current.ridingTip}
          </p>
        </>
      ) : (
        <p className="mt-4 text-sm leading-6 text-slate-500">
          실시간 날씨 API 키를 설정하면 서울 기준 날씨가 표시됩니다.
        </p>
      )}

      <Link
        href="/weather"
        className="mt-4 inline-block text-sm font-semibold text-orange-500"
      >
        자세히 보기 →
      </Link>
    </div>
  );
}
