import {
  buildHourlyOutlook,
  evaluateRidingGoNoGo,
  formatDayLabel,
  formatSunsetTime,
  formatWind,
  getAirQualityAssessment,
  getHoursUntilSunset,
  getRidingAssessment,
  goNoGoToRidingScore,
  ridingCities,
  weatherEmoji,
  type FetchWeatherResult,
} from "@/lib/weather";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

type Coordinates = {
  lat: number;
  lon: number;
  name: string;
};

const cityCoordinates = new Map<string, Coordinates>(
  ridingCities.map((city) => {
    const coords = getKnownCityCoordinates(city.query);
    return [city.query, coords ?? { lat: 37.5665, lon: 126.978, name: city.name }];
  })
);

function getKnownCityCoordinates(query: string): Coordinates | null {
  const table: Record<string, Coordinates> = {
    "Seoul,KR": { lat: 37.5665, lon: 126.978, name: "서울" },
    "Busan,KR": { lat: 35.1796, lon: 129.0756, name: "부산" },
    "Jeju,KR": { lat: 33.4996, lon: 126.5312, name: "제주" },
    "Gangneung,KR": { lat: 37.7519, lon: 128.8761, name: "강릉" },
    "Daejeon,KR": { lat: 36.3504, lon: 127.3845, name: "대전" },
    "Gwangju,KR": { lat: 35.1595, lon: 126.8526, name: "광주" },
    "Daegu,KR": { lat: 35.8714, lon: 128.6014, name: "대구" },
    "Incheon,KR": { lat: 37.4563, lon: 126.7052, name: "인천" },
    "Cheonan,KR": { lat: 36.8151, lon: 127.1139, name: "천안" },
    "Cheongju,KR": { lat: 36.6424, lon: 127.489, name: "청주" },
    "Asan,KR": { lat: 36.7898, lon: 127.0023, name: "아산" },
    "Sejong,KR": { lat: 36.48, lon: 127.289, name: "세종" },
    "Suwon,KR": { lat: 37.2636, lon: 127.0286, name: "수원" },
    "Chuncheon,KR": { lat: 37.8813, lon: 127.73, name: "춘천" },
    "Jeonju,KR": { lat: 35.8242, lon: 127.148, name: "전주" },
    "Ulsan,KR": { lat: 35.5384, lon: 129.3114, name: "울산" },
    "Pohang,KR": { lat: 36.019, lon: 129.3435, name: "포항" },
    "Wonju,KR": { lat: 37.3422, lon: 127.9202, name: "원주" },
  };

  return table[query] ?? null;
}

function weatherCodeToCondition(code: number): { main: string; description: string } {
  if (code === 0) return { main: "Clear", description: "맑음" };
  if (code === 1) return { main: "Clear", description: "대체로 맑음" };
  if (code === 2) return { main: "Clouds", description: "구름 조금" };
  if (code === 3) return { main: "Clouds", description: "흐림" };
  if (code === 45 || code === 48) return { main: "Fog", description: "안개" };
  if (code >= 51 && code <= 57) return { main: "Drizzle", description: "이슬비" };
  if (code >= 61 && code <= 67) return { main: "Rain", description: "비" };
  if (code >= 71 && code <= 77) return { main: "Snow", description: "눈" };
  if (code >= 80 && code <= 82) return { main: "Rain", description: "소나기" };
  if (code >= 95) return { main: "Thunderstorm", description: "뇌우" };
  return { main: "Clouds", description: "흐림" };
}

function europeanAqiToScale(aqi: number | null): number | null {
  if (aqi == null) return null;
  if (aqi <= 20) return 1;
  if (aqi <= 40) return 2;
  if (aqi <= 60) return 3;
  if (aqi <= 80) return 4;
  return 5;
}

type OpenMeteoForecast = {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m?: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
  };
};

type OpenMeteoAir = {
  current?: {
    pm10?: number;
    pm2_5?: number;
    european_aqi?: number;
  };
};

async function resolveCoordinates(options: {
  city?: string;
  lat?: string;
  lon?: string;
}): Promise<Coordinates | null> {
  if (options.lat && options.lon) {
    const lat = Number(options.lat);
    const lon = Number(options.lon);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return { lat, lon, name: "현재 위치" };
    }
  }

  const city = options.city ?? "Seoul,KR";
  const known = cityCoordinates.get(city);
  if (known) return known;

  const cityName = city.split(",")[0]?.trim();
  if (!cityName) return null;

  try {
    const response = await fetch(
      `${GEOCODE_URL}?name=${encodeURIComponent(cityName)}&count=1&language=ko&countryCode=KR`,
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) return null;

    const data = (await response.json()) as {
      results?: Array<{ latitude: number; longitude: number; name: string }>;
    };
    const result = data.results?.[0];
    if (!result) return null;

    return {
      lat: result.latitude,
      lon: result.longitude,
      name: result.name,
    };
  } catch {
    return null;
  }
}

export async function fetchOpenMeteoWeather(options: {
  city?: string;
  lat?: string;
  lon?: string;
  fresh?: boolean;
}): Promise<FetchWeatherResult> {
  const coords = await resolveCoordinates(options);

  if (!coords) {
    return {
      ok: false,
      error: "지역 정보를 찾지 못했습니다. 다른 도시를 선택해 주세요.",
      status: 404,
    };
  }

  const fetchInit = options.fresh
    ? { cache: "no-store" as const }
    : { next: { revalidate: 300 } };

  const forecastParams = new URLSearchParams({
    latitude: String(coords.lat),
    longitude: String(coords.lon),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m",
    hourly: "temperature_2m,precipitation_probability,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
    timezone: "Asia/Seoul",
    forecast_days: "5",
  });

  try {
    const [forecastRes, airRes] = await Promise.all([
      fetch(`${FORECAST_URL}?${forecastParams}`, fetchInit),
      fetch(
        `${AIR_URL}?latitude=${coords.lat}&longitude=${coords.lon}&current=pm10,pm2_5,european_aqi`,
        fetchInit
      ),
    ]);

    if (!forecastRes.ok) {
      return {
        ok: false,
        error: "날씨 정보를 불러오지 못했습니다.",
        status: forecastRes.status,
      };
    }

    const forecast = (await forecastRes.json()) as OpenMeteoForecast;
    const air = airRes.ok ? ((await airRes.json()) as OpenMeteoAir) : null;

    const currentCondition = weatherCodeToCondition(forecast.current.weather_code);
    const windSpeed = forecast.current.wind_speed_10m;
    const todayPop = forecast.daily.precipitation_probability_max[0] ?? 0;
    const sunsetIso = forecast.daily.sunset[0];
    const sunsetUnix = sunsetIso
      ? Math.floor(new Date(sunsetIso).getTime() / 1000)
      : null;
    const hoursUntilSunset =
      sunsetUnix != null ? getHoursUntilSunset(sunsetUnix) : null;

    const pm25 = air?.current?.pm2_5 ?? null;
    const pm10 = air?.current?.pm10 ?? null;
    const airAqi = europeanAqiToScale(air?.current?.european_aqi ?? null);

    const goNoGo = evaluateRidingGoNoGo({
      temp: forecast.current.temperature_2m,
      feelsLike: forecast.current.apparent_temperature,
      windSpeed,
      main: currentCondition.main,
      pop: todayPop,
      visibilityKm: null,
      hoursUntilSunset,
      airAqi,
      pm25,
    });

    const airQuality = getAirQualityAssessment(airAqi, pm25);

    const hourlyItems = forecast.hourly.time.slice(0, 8).map((time, index) => {
      const main = weatherCodeToCondition(
        forecast.hourly.weather_code[index] ?? 3
      ).main;
      const pop = forecast.hourly.precipitation_probability[index] ?? 0;
      const hour = new Date(time).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Seoul",
      });

      return {
        dt_txt: `${time.replace("T", " ").slice(0, 16)}:00`,
        main: { temp: forecast.hourly.temperature_2m[index] ?? 0 },
        weather: [{ main, description: weatherCodeToCondition(forecast.hourly.weather_code[index] ?? 3).description }],
        pop: pop / 100,
        _hourLabel: hour,
      };
    });

    const dailyForecast = forecast.daily.time.slice(0, 5).map((date, index) => {
      const main = weatherCodeToCondition(forecast.daily.weather_code[index] ?? 3).main;
      const high = Math.round(forecast.daily.temperature_2m_max[index] ?? 0);
      const low = Math.round(forecast.daily.temperature_2m_min[index] ?? 0);
      const pop = forecast.daily.precipitation_probability_max[index] ?? 0;
      const assessment = getRidingAssessment({
        temp: (high + low) / 2,
        windSpeed: 0,
        main,
        pop,
      });

      return {
        day: formatDayLabel(date, index),
        emoji: weatherEmoji(main),
        high,
        low,
        note: assessment.note,
        pop,
      };
    });

    const hourly = buildHourlyOutlook(
      hourlyItems.map(({ _hourLabel: _, ...item }) => item)
    ).map((item, index) => ({
      ...item,
      time: hourlyItems[index]?._hourLabel ?? item.time,
    }));

    return {
      ok: true,
      data: {
        provider: "open-meteo",
        current: {
          location: coords.name,
          temperature: Math.round(forecast.current.temperature_2m),
          feelsLike: Math.round(forecast.current.apparent_temperature),
          condition: currentCondition.description,
          emoji: weatherEmoji(currentCondition.main),
          wind: formatWind(windSpeed, forecast.current.wind_direction_10m),
          windSpeed,
          humidity: `${Math.round(forecast.current.relative_humidity_2m)}%`,
          visibility: "정보 없음",
          pop: todayPop,
          sunset: sunsetUnix != null ? formatSunsetTime(sunsetUnix) : "정보 없음",
          hoursUntilSunset,
          airQualityLabel: airQuality.label,
          pm25: pm25 != null ? Math.round(pm25) : null,
          pm10: pm10 != null ? Math.round(pm10) : null,
          ridingTip: goNoGo.summary,
          ridingScore: goNoGoToRidingScore(goNoGo.verdict),
          goNoGo,
        },
        forecast: dailyForecast,
        hourly,
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
