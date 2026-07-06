export type RidingCity = {
  id: string;
  name: string;
  query: string;
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
  ridingTip: string;
  ridingScore: "good" | "caution" | "bad";
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
  current: CurrentWeather;
  forecast: DailyForecast[];
};

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

export function weatherEmoji(main: string): string {
  switch (main) {
    case "Clear":
      return "☀️";
    case "Clouds":
      return "⛅";
    case "Rain":
      return "🌧️";
    case "Drizzle":
      return "🌦️";
    case "Thunderstorm":
      return "⛈️";
    case "Snow":
      return "❄️";
    case "Mist":
    case "Fog":
    case "Haze":
      return "🌫️";
    default:
      return "🌤️";
  }
}

function windDirection(deg: number): string {
  const dirs = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
  return dirs[Math.round(deg / 45) % 8];
}

export function formatWind(speed: number, deg?: number): string {
  const direction = deg != null ? `${windDirection(deg)}풍 ` : "";
  return `${direction}${speed.toFixed(1)}m/s`;
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

export function formatDayLabel(dateStr: string, index: number): string {
  if (index === 0) return "오늘";
  if (index === 1) return "내일";

  const date = new Date(`${dateStr}T12:00:00`);
  return weekdayLabels[date.getDay()];
}

type ForecastItem = {
  dt_txt: string;
  main: { temp: number };
  weather: Array<{ main: string; description: string }>;
  pop: number;
};

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
