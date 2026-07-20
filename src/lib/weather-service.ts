import {
  aggregateDailyForecast,
  buildHourlyOutlook,
  evaluateRidingGoNoGo,
  formatSunsetTime,
  formatWind,
  getAirQualityAssessment,
  getHoursUntilSunset,
  goNoGoToRidingScore,
  type FetchWeatherOptions,
  type FetchWeatherResult,
  weatherEmoji,
} from "@/lib/weather";
import { fetchOpenMeteoWeather } from "@/lib/open-meteo-service";

const CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";
const AIR_URL = "https://api.openweathermap.org/data/2.5/air_pollution";

type OpenWeatherCurrent = {
  name: string;
  coord?: { lat: number; lon: number };
  sys?: { sunrise: number; sunset: number };
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

type OpenWeatherAir = {
  list: Array<{
    main: { aqi: number };
    components: { pm2_5?: number; pm10?: number };
  }>;
};

export type { FetchWeatherOptions, FetchWeatherResult } from "@/lib/weather";

async function fetchAirQuality(
  lat: number,
  lon: number,
  apiKey: string,
  fetchInit: RequestInit
): Promise<{ aqi: number | null; pm25: number | null; pm10: number | null }> {
  try {
    const response = await fetch(
      `${AIR_URL}?lat=${lat}&lon=${lon}&appid=${apiKey}`,
      fetchInit
    );

    if (!response.ok) {
      return { aqi: null, pm25: null, pm10: null };
    }

    const data = (await response.json()) as OpenWeatherAir;
    const latest = data.list[0];

    return {
      aqi: latest?.main.aqi ?? null,
      pm25: latest?.components.pm2_5 ?? null,
      pm10: latest?.components.pm10 ?? null,
    };
  } catch {
    return { aqi: null, pm25: null, pm10: null };
  }
}

export async function fetchWeather(
  options: FetchWeatherOptions = {}
): Promise<FetchWeatherResult> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY?.trim();

  if (apiKey) {
    const result = await fetchOpenWeatherMap(options, apiKey);
    if (result.ok) return result;

    const fallback = await fetchOpenMeteoWeather(options);
    if (fallback.ok) return fallback;

    return result;
  }

  return fetchOpenMeteoWeather(options);
}

async function fetchOpenWeatherMap(
  options: FetchWeatherOptions,
  apiKey: string
): Promise<FetchWeatherResult> {
  const city = options.city ?? "Seoul,KR";
  const locationQuery =
    options.lat && options.lon
      ? `lat=${options.lat}&lon=${options.lon}`
      : `q=${encodeURIComponent(city)}`;

  const commonParams = `${locationQuery}&appid=${apiKey}&units=metric&lang=kr`;
  const fetchInit = options.fresh
    ? { cache: "no-store" as const }
    : { next: { revalidate: 300 } };

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${CURRENT_URL}?${commonParams}`, fetchInit),
      fetch(`${FORECAST_URL}?${commonParams}`, fetchInit),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      const failed = !currentRes.ok ? currentRes : forecastRes;
      const errorBody = (await failed.json()) as {
        message?: string;
      };
      const message = errorBody.message ?? "날씨 정보를 불러오지 못했습니다.";

      if (failed.status === 401) {
        return {
          ok: false,
          error: message.includes("Invalid API key")
            ? "OpenWeatherMap API 키가 유효하지 않습니다. 키를 다시 복사했는지, 발급 후 활성화까지 10분~2시간 기다렸는지 확인해 주세요."
            : message,
          status: 401,
        };
      }

      return { ok: false, error: message, status: failed.status };
    }

    const current = (await currentRes.json()) as OpenWeatherCurrent;
    const forecast = (await forecastRes.json()) as OpenWeatherForecast;

    const lat = current.coord?.lat ?? Number(options.lat);
    const lon = current.coord?.lon ?? Number(options.lon);

    const air =
      Number.isFinite(lat) && Number.isFinite(lon)
        ? await fetchAirQuality(lat, lon, apiKey, fetchInit)
        : { aqi: null, pm25: null, pm10: null };

    const main = current.weather[0]?.main ?? "Clouds";
    const description = current.weather[0]?.description ?? "정보 없음";
    const windSpeed = current.wind?.speed ?? 0;
    const todayPop = Math.round(
      Math.max(...forecast.list.slice(0, 8).map((item) => item.pop), 0) * 100
    );
    const visibilityKm =
      current.visibility != null ? current.visibility / 1000 : null;
    const sunsetUnix = current.sys?.sunset ?? null;
    const hoursUntilSunset =
      sunsetUnix != null ? getHoursUntilSunset(sunsetUnix) : null;

    const goNoGo = evaluateRidingGoNoGo({
      temp: current.main.temp,
      feelsLike: current.main.feels_like,
      windSpeed,
      main,
      pop: todayPop,
      visibilityKm,
      hoursUntilSunset,
      airAqi: air.aqi,
      pm25: air.pm25,
    });

    const airQuality = getAirQualityAssessment(air.aqi, air.pm25);

    return {
      ok: true,
      data: {
        provider: "openweathermap",
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
            visibilityKm != null
              ? `${visibilityKm.toFixed(1)}km`
              : "정보 없음",
          pop: todayPop,
          sunset: sunsetUnix != null ? formatSunsetTime(sunsetUnix) : "정보 없음",
          hoursUntilSunset,
          airQualityLabel: airQuality.label,
          pm25: air.pm25 != null ? Math.round(air.pm25) : null,
          pm10: air.pm10 != null ? Math.round(air.pm10) : null,
          ridingTip: goNoGo.summary,
          ridingScore: goNoGoToRidingScore(goNoGo.verdict),
          goNoGo,
        },
        forecast: aggregateDailyForecast(forecast.list),
        hourly: buildHourlyOutlook(forecast.list),
        updatedAt: new Date().toISOString(),
      },
    };
  } catch {
    return {
      ok: false,
      error: "날씨 API 요청 중 오류가 발생했습니다.",
      status: 502,
    };
  }
}
