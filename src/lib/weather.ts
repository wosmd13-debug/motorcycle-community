export type RidingCity = {
  id: string;
  name: string;
  query: string;
};

export type GoNoGoVerdict = "go" | "caution" | "no-go";

export type RidingFactorStatus = "good" | "caution" | "bad";

export type RidingFactor = {
  id: string;
  label: string;
  status: RidingFactorStatus;
  value: string;
  detail: string;
};

export type RidingGoNoGo = {
  verdict: GoNoGoVerdict;
  headline: string;
  summary: string;
  factors: RidingFactor[];
};

export type HourlyOutlook = {
  time: string;
  temp: number;
  pop: number;
  condition: string;
  score: CurrentWeather["ridingScore"];
};

export type CurrentWeather = {
  location: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  emoji: string;
  wind: string;
  windSpeed: number;
  humidity: string;
  visibility: string;
  pop: number;
  sunset: string;
  hoursUntilSunset: number | null;
  airQualityLabel: string;
  pm25: number | null;
  pm10: number | null;
  ridingTip: string;
  ridingScore: "good" | "caution" | "bad";
  goNoGo: RidingGoNoGo;
};

export type DailyForecast = {
  day: string;
  emoji: string;
  high: number;
  low: number;
  note: string;
  pop: number;
};

export type WeatherResponse = {
  provider?: "openweathermap" | "open-meteo";
  current: CurrentWeather;
  forecast: DailyForecast[];
  hourly: HourlyOutlook[];
  updatedAt?: string;
};

export type FetchWeatherOptions = {
  city?: string;
  lat?: string;
  lon?: string;
  /** true면 캐시 없이 외부 API에서 바로 조회 */
  fresh?: boolean;
};

export type FetchWeatherResult =
  | { ok: true; data: WeatherResponse }
  | { ok: false; error: string; status: number };

export const ridingCities: RidingCity[] = [
  { id: "seoul", name: "서울", query: "Seoul,KR" },
  { id: "busan", name: "부산", query: "Busan,KR" },
  { id: "jeju", name: "제주", query: "Jeju,KR" },
  { id: "gangneung", name: "강릉", query: "Gangneung,KR" },
  { id: "daejeon", name: "대전", query: "Daejeon,KR" },
  { id: "gwangju", name: "광주", query: "Gwangju,KR" },
  { id: "daegu", name: "대구", query: "Daegu,KR" },
  { id: "incheon", name: "인천", query: "Incheon,KR" },
  { id: "cheonan", name: "천안", query: "Cheonan,KR" },
  { id: "cheongju", name: "청주", query: "Cheongju,KR" },
  { id: "asan", name: "아산", query: "Asan,KR" },
  { id: "sejong", name: "세종", query: "Sejong,KR" },
  { id: "suwon", name: "수원", query: "Suwon,KR" },
  { id: "chuncheon", name: "춘천", query: "Chuncheon,KR" },
  { id: "jeonju", name: "전주", query: "Jeonju,KR" },
  { id: "ulsan", name: "울산", query: "Ulsan,KR" },
  { id: "pohang", name: "포항", query: "Pohang,KR" },
  { id: "wonju", name: "원주", query: "Wonju,KR" },
];

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

export function weatherEmoji(_main: string): string {
  return "";
}

function windDirection(deg: number): string {
  const dirs = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
  return dirs[Math.round(deg / 45) % 8];
}

export function formatWind(speed: number, deg?: number): string {
  const direction = deg != null ? `${windDirection(deg)}풍 ` : "";
  return `${direction}${speed.toFixed(1)}m/s`;
}

export function formatSunsetTime(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Seoul",
  });
}

export function getHoursUntilSunset(unixSeconds: number): number {
  const sunsetMs = unixSeconds * 1000;
  const nowMs = Date.now();
  if (nowMs >= sunsetMs) return 0;
  return (sunsetMs - nowMs) / (1000 * 60 * 60);
}

export function getAirQualityAssessment(aqi: number | null, pm25: number | null): {
  label: string;
  status: RidingFactorStatus;
  detail: string;
} {
  if (aqi == null) {
    return {
      label: "정보 없음",
      status: "caution",
      detail: "미세먼지 정보를 불러오지 못했습니다.",
    };
  }

  if (aqi >= 4) {
    return {
      label: "나쁨",
      status: "bad",
      detail: "마스크 착용을 권장하며, 장시간 야외 라이딩은 피하세요.",
    };
  }

  if (aqi === 3) {
    return {
      label: "보통",
      status: "caution",
      detail: "민감군은 마스크 착용 후 짧게 라이딩하세요.",
    };
  }

  const pmLabel =
    pm25 != null ? ` PM2.5 ${Math.round(pm25)}µg/m³` : "";

  return {
    label: aqi === 1 ? "좋음" : "양호",
    status: "good",
    detail: `공기질이 양호합니다.${pmLabel}`,
  };
}

export function evaluateRidingGoNoGo(options: {
  temp: number;
  feelsLike: number;
  windSpeed: number;
  main: string;
  pop: number;
  visibilityKm: number | null;
  hoursUntilSunset: number | null;
  airAqi: number | null;
  pm25: number | null;
}): RidingGoNoGo {
  const {
    temp,
    feelsLike,
    windSpeed,
    main,
    pop,
    visibilityKm,
    hoursUntilSunset,
    airAqi,
    pm25,
  } = options;

  const factors: RidingFactor[] = [];

  if (main === "Thunderstorm") {
    factors.push({
      id: "rain",
      label: "강수·낙뢰",
      status: "bad",
      value: "뇌우",
      detail: "뇌우 예보입니다. 라이딩을 미루세요.",
    });
  } else if (main === "Rain" || pop >= 70) {
    factors.push({
      id: "rain",
      label: "강수",
      status: "bad",
      value: `강수 ${pop}%`,
      detail: "비가 올 가능성이 높습니다. 우비·미끄럼에 주의하세요.",
    });
  } else if (pop >= 40) {
    factors.push({
      id: "rain",
      label: "강수",
      status: "caution",
      value: `강수 ${pop}%`,
      detail: "소나기 가능성이 있습니다. 접이식 우비를 챙기세요.",
    });
  } else {
    factors.push({
      id: "rain",
      label: "강수",
      status: "good",
      value: `강수 ${pop}%`,
      detail: "당장 비 소식은 없습니다.",
    });
  }

  if (windSpeed >= 10) {
    factors.push({
      id: "wind",
      label: "바람",
      status: "bad",
      value: `${windSpeed.toFixed(1)}m/s`,
      detail: "강풍입니다. 고속·교량·터널 출구에서 횡풍에 주의하세요.",
    });
  } else if (windSpeed >= 7) {
    factors.push({
      id: "wind",
      label: "바람",
      status: "caution",
      value: `${windSpeed.toFixed(1)}m/s`,
      detail: "바람이 다소 강합니다. 차선 유지에 신경 쓰세요.",
    });
  } else {
    factors.push({
      id: "wind",
      label: "바람",
      status: "good",
      value: `${windSpeed.toFixed(1)}m/s`,
      detail: "바람은 라이딩에 무리가 없는 수준입니다.",
    });
  }

  if (feelsLike <= 0 || temp <= -2) {
    factors.push({
      id: "temp",
      label: "체감온도",
      status: "bad",
      value: `${Math.round(feelsLike)}°`,
      detail: "매우 춥습니다. 방한 장비와 노면 결빙을 확인하세요.",
    });
  } else if (feelsLike <= 5 || temp <= 5) {
    factors.push({
      id: "temp",
      label: "체감온도",
      status: "caution",
      value: `${Math.round(feelsLike)}°`,
      detail: "기온이 낮습니다. 장갑·방풍 레이어를 권장합니다.",
    });
  } else if (feelsLike >= 35 || temp >= 33) {
    factors.push({
      id: "temp",
      label: "체감온도",
      status: "caution",
      value: `${Math.round(feelsLike)}°`,
      detail: "무더운 날씨입니다. 수분·휴식·통풍 장비를 챙기세요.",
    });
  } else {
    factors.push({
      id: "temp",
      label: "체감온도",
      status: "good",
      value: `${Math.round(feelsLike)}°`,
      detail: "체감온도가 라이딩하기 무난합니다.",
    });
  }

  const air = getAirQualityAssessment(airAqi, pm25);
  factors.push({
    id: "air",
    label: "미세먼지",
    status: air.status,
    value: air.label,
    detail: air.detail,
  });

  if (hoursUntilSunset != null) {
    if (hoursUntilSunset <= 0) {
      factors.push({
        id: "sunset",
        label: "일몰",
        status: "caution",
        value: "야간",
        detail: "해가 졌습니다. 전조등·반사 장비를 확인하세요.",
      });
    } else if (hoursUntilSunset <= 1) {
      factors.push({
        id: "sunset",
        label: "일몰",
        status: "caution",
        value: "1시간 이내",
        detail: "곧 어두워집니다. 귀가 시간을 넉넉히 잡으세요.",
      });
    } else {
      factors.push({
        id: "sunset",
        label: "일몰",
        status: "good",
        value: `${Math.floor(hoursUntilSunset)}시간 후`,
        detail: "주간 라이딩 시간이 충분합니다.",
      });
    }
  }

  if (visibilityKm != null) {
    if (visibilityKm < 3) {
      factors.push({
        id: "visibility",
        label: "가시거리",
        status: "bad",
        value: `${visibilityKm.toFixed(1)}km`,
        detail: "안개·강수로 시야가 매우 제한됩니다.",
      });
    } else if (visibilityKm < 5) {
      factors.push({
        id: "visibility",
        label: "가시거리",
        status: "caution",
        value: `${visibilityKm.toFixed(1)}km`,
        detail: "시야가 다소 제한됩니다. 속도를 줄이세요.",
      });
    }
  }

  const badCount = factors.filter((factor) => factor.status === "bad").length;
  const cautionCount = factors.filter((factor) => factor.status === "caution").length;

  let verdict: GoNoGoVerdict = "go";
  let headline = "GO — 라이딩 OK";
  let summary = "현재 조건에서 라이딩하기 무난합니다. 헬멧·장갑·수분만 챙기세요.";

  if (badCount > 0) {
    verdict = "no-go";
    headline = "NO-GO — 라이딩 비추천";
    summary =
      "위험 요인이 있습니다. 일정을 미루거나 실내·대중교통을 고려하세요.";
  } else if (cautionCount >= 2) {
    verdict = "no-go";
    headline = "NO-GO — 조건 불량";
    summary = "주의 항목이 여러 개입니다. 꼭 필요할 때만 짧게 라이딩하세요.";
  } else if (cautionCount === 1) {
    verdict = "caution";
    headline = "주의 — 짧은 라이딩";
    summary = "대체로 가능하지만 아래 주의 항목을 확인하고 속도·시간을 조절하세요.";
  }

  return { verdict, headline, summary, factors };
}

export function goNoGoToRidingScore(
  verdict: GoNoGoVerdict
): CurrentWeather["ridingScore"] {
  switch (verdict) {
    case "go":
      return "good";
    case "caution":
      return "caution";
    case "no-go":
      return "bad";
  }
}

export function goNoGoLabel(verdict: GoNoGoVerdict): string {
  switch (verdict) {
    case "go":
      return "GO";
    case "caution":
      return "주의";
    case "no-go":
      return "NO-GO";
  }
}

export function goNoGoColor(verdict: GoNoGoVerdict): string {
  switch (verdict) {
    case "go":
      return "bg-emerald-600 text-white";
    case "caution":
      return "bg-amber-500 text-white";
    case "no-go":
      return "bg-red-600 text-white";
  }
}

export function factorStatusColor(status: RidingFactorStatus): string {
  switch (status) {
    case "good":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "caution":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "bad":
      return "border-red-200 bg-red-50 text-red-800";
  }
}

export function factorStatusIcon(status: RidingFactorStatus): string {
  switch (status) {
    case "good":
      return "✓";
    case "caution":
      return "!";
    case "bad":
      return "✕";
  }
}

export function formatDayLabel(dateStr: string, index: number): string {
  if (index === 0) return "오늘";
  if (index === 1) return "내일";

  const date = new Date(`${dateStr}T12:00:00`);
  return weekdayLabels[date.getDay()];
}

export type ForecastItem = {
  dt_txt: string;
  main: { temp: number };
  weather: Array<{ main: string; description: string }>;
  pop: number;
};

export function buildHourlyOutlook(
  list: ForecastItem[],
  limit = 6
): HourlyOutlook[] {
  return list.slice(0, limit).map((item) => {
    const main = item.weather[0]?.main ?? "Clouds";
    const pop = Math.round(item.pop * 100);
    const assessment = getRidingAssessment({
      temp: item.main.temp,
      windSpeed: 0,
      main,
      pop,
    });

    const hour = item.dt_txt.split(" ")[1]?.slice(0, 5) ?? "";

    return {
      time: hour,
      temp: Math.round(item.main.temp),
      pop,
      condition: item.weather[0]?.description ?? "",
      score: assessment.score,
    };
  });
}

export function getRidingAssessment(options: {
  temp: number;
  windSpeed: number;
  main: string;
  pop?: number;
}): { tip: string; score: CurrentWeather["ridingScore"]; note: string } {
  const { temp, windSpeed, main, pop = 0 } = options;

  if (main === "Thunderstorm") {
    return {
      score: "bad",
      tip: "뇌우 예보입니다. 라이딩을 미루는 것이 안전합니다.",
      note: "뇌우, 라이딩 비추천",
    };
  }

  if (main === "Rain" || pop >= 70) {
    return {
      score: "bad",
      tip: "비가 올 가능성이 높습니다. 방수 장비와 미끄럼 주의가 필요해요.",
      note: "비 예보, 우비 필수",
    };
  }

  if (windSpeed >= 10) {
    return {
      score: "bad",
      tip: "바람이 강합니다. 고속 주행 시 횡풍에 특히 주의하세요.",
      note: "강풍 주의",
    };
  }

  if (temp >= 33) {
    return {
      score: "caution",
      tip: "무더운 날씨입니다. 수분 보충과 통풍 잘 되는 장비를 권장해요.",
      note: "폭염, 수분 보충",
    };
  }

  if (temp <= 5) {
    return {
      score: "caution",
      tip: "기온이 낮습니다. 장갑·방한 장비를 챙기고 노면 결빙을 확인하세요.",
      note: "저온, 방한 필수",
    };
  }

  if (windSpeed >= 7 || pop >= 40) {
    return {
      score: "caution",
      tip: "바람이거나 소나기 가능성이 있습니다. 여벌 장갑과 우비를 준비하면 좋아요.",
      note: "바람·소나기 주의",
    };
  }

  if (main === "Clear") {
    return {
      score: "good",
      tip: "라이딩하기 좋은 날씨입니다. 헬멧 썬바이저와 선크림도 챙기세요.",
      note: "라이딩하기 좋음",
    };
  }

  return {
    score: "good",
    tip: "전반적으로 무난한 날씨입니다. 출발 전 바람 방향만 한번 더 확인하세요.",
    note: "무난한 날씨",
  };
}

export function aggregateDailyForecast(list: ForecastItem[]): DailyForecast[] {
  const byDay = new Map<string, ForecastItem[]>();

  for (const item of list) {
    const date = item.dt_txt.split(" ")[0];
    const items = byDay.get(date) ?? [];
    items.push(item);
    byDay.set(date, items);
  }

  return Array.from(byDay.entries())
    .slice(0, 5)
    .map(([date, items], index) => {
      const temps = items.map((item) => item.main.temp);
      const high = Math.round(Math.max(...temps));
      const low = Math.round(Math.min(...temps));
      const midday =
        items.find((item) => item.dt_txt.includes("12:00:00")) ??
        items[Math.floor(items.length / 2)];
      const main = midday.weather[0]?.main ?? "Clouds";
      const maxPop = Math.round(Math.max(...items.map((item) => item.pop)) * 100);
      const assessment = getRidingAssessment({
        temp: (high + low) / 2,
        windSpeed: 0,
        main,
        pop: maxPop,
      });

      return {
        day: formatDayLabel(date, index),
        emoji: weatherEmoji(main),
        high,
        low,
        note: assessment.note,
        pop: maxPop,
      };
    });
}

export function ridingScoreLabel(score: CurrentWeather["ridingScore"]): string {
  switch (score) {
    case "good":
      return "라이딩 적합";
    case "caution":
      return "주의 필요";
    case "bad":
      return "라이딩 비추천";
  }
}

export function ridingScoreColor(score: CurrentWeather["ridingScore"]): string {
  switch (score) {
    case "good":
      return "bg-emerald-100 text-emerald-800";
    case "caution":
      return "bg-amber-100 text-amber-800";
    case "bad":
      return "bg-red-100 text-red-800";
  }
}

export function formatWeatherUpdated(iso?: string): string {
  if (!iso) return "방금 전";

  const updated = new Date(iso);
  if (Number.isNaN(updated.getTime())) return "방금 전";

  return updated.toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
