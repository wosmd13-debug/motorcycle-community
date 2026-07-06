import { NextRequest, NextResponse } from "next/server";
import {
  aggregateDailyForecast,
  formatWind,
  getRidingAssessment,
  type WeatherResponse,
  weatherEmoji,
} from "@/lib/weather";

const CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

type OpenWeatherCurrent = {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  wind: {
    speed: number;
    deg?: number;
  };
  visibility?: number;
  weather: Array<{ main: string; description: string }>;
};

type OpenWeatherForecast = {
  list: Array<{
    dt_txt: string;
    main: { temp: number };
    weather: Array<{ main: string; description: string }>;
    pop: number;
  }>;
};

export async function GET(request: NextRequest) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OpenWeatherMap API 키가 없습니다. .env.local에 OPENWEATHERMAP_API_KEY를 추가해 주세요.",
      },
      { status: 500 }
    );
  }

  const { searchParams } = request.nextUrl;
  const city = searchParams.get("city") ?? "Seoul,KR";
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  const locationQuery =
    lat && lon
      ? `lat=${lat}&lon=${lon}`
      : `q=${encodeURIComponent(city)}`;

  const commonParams = `${locationQuery}&appid=${apiKey}&units=metric&lang=kr`;

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${CURRENT_URL}?${commonParams}`, { cache: "no-store" }),
      fetch(`${FORECAST_URL}?${commonParams}`, { cache: "no-store" }),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      const failed = !currentRes.ok ? currentRes : forecastRes;
      const errorBody = (await failed.json()) as { message?: string; cod?: number | string };
      const message = errorBody.message ?? "날씨 정보를 불러오지 못했습니다.";

      if (failed.status === 401) {
        return NextResponse.json(
          {
            error:
              message.includes("Invalid API key")
                ? "OpenWeatherMap API 키가 유효하지 않습니다. 키를 다시 복사했는지, 발급 후 활성화까지 10분~2시간 기다렸는지 확인해 주세요."
                : message,
          },
          { status: 401 }
        );
      }

      return NextResponse.json({ error: message }, { status: failed.status });
    }

    const current = (await currentRes.json()) as OpenWeatherCurrent;
    const forecast = (await forecastRes.json()) as OpenWeatherForecast;

    const main = current.weather[0]?.main ?? "Clouds";
    const description = current.weather[0]?.description ?? "정보 없음";
    const windSpeed = current.wind?.speed ?? 0;
    const todayPop = Math.round(
      Math.max(...forecast.list.slice(0, 8).map((item) => item.pop), 0) * 100
    );

    const assessment = getRidingAssessment({
      temp: current.main.temp,
      windSpeed,
      main,
      pop: todayPop,
    });

    const payload: WeatherResponse = {
      current: {
        location: current.name,
        temperature: Math.round(current.main.temp),
        feelsLike: Math.round(current.main.feels_like),
        condition: description,
        emoji: weatherEmoji(main),
        wind: formatWind(windSpeed, current.wind?.deg),
        windSpeed,
        humidity: `${current.main.humidity}%`,
        visibility:
          current.visibility != null
            ? `${(current.visibility / 1000).toFixed(1)}km`
            : "정보 없음",
        ridingTip: assessment.tip,
        ridingScore: assessment.score,
      },
      forecast: aggregateDailyForecast(forecast.list),
    };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "날씨 API 요청 중 오류가 발생했습니다." },
      { status: 502 }
    );
  }
}
