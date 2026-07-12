import {
  filterRegions,
  matchesDetailRegion,
  type DetailRegion,
} from "@/lib/regions";

export type RouteDifficulty = "초급" | "중급" | "상급";
export type RouteType = "해안" | "산악" | "일주" | "당일치기" | "투어";

export type RouteWaypoint = {
  name: string;
  lat: number;
  lng: number;
  note?: string;
};

export type BariRoute = {
  id: number;
  name: string;
  region: DetailRegion;
  type: RouteType;
  difficulty: RouteDifficulty;
  distance: string;
  distanceKm: number;
  duration: string;
  bestSeason: string[];
  description: string;
  startPoint: string;
  endPoint: string;
  waypoints: RouteWaypoint[];
  highlights: string[];
  tips: string[];
  cautions: string[];
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
};

export const routeRegions = filterRegions;
export type RouteRegion = DetailRegion;

export const routeDifficulties: RouteDifficulty[] = ["초급", "중급", "상급"];
export const routeTypes: RouteType[] = ["해안", "산악", "일주", "당일치기", "투어"];

export const defaultBariRoutes: BariRoute[] = [
  {
    id: 1,
    name: "남해 해안 일주",
    region: "경남",
    type: "일주",
    difficulty: "중급",
    distance: "약 180km",
    distanceKm: 180,
    duration: "5~6시간",
    bestSeason: ["봄", "가을"],
    description:
      "남해안을 따라 이어지는 대표 바리 코스. 완만한 커브와 바다 전망이 좋아 주말 투어에 인기가 많습니다.",
    startPoint: "창원/마산",
    endPoint: "통영",
    waypoints: [
      { name: "마산", lat: 35.225, lng: 128.575, note: "출발 · 연료 보충" },
      { name: "남해 대교", lat: 34.918, lng: 128.025, note: "해안 진입" },
      { name: "설리해수욕장", lat: 34.837, lng: 127.892, note: "휴식 포인트" },
      { name: "독일마을", lat: 34.776, lng: 127.955, note: "경치 좋은 구간" },
      { name: "통영", lat: 34.854, lng: 128.433, note: "도착 · 식사" },
    ],
    highlights: [
      "해안선을 따라 이어지는 완만한 커브",
      "설리·독일마을 등 드라이브 명소",
      "통영 케이블카·식당 연계 가능",
    ],
    tips: [
      "오전 출발 시 오후 바람이 강해질 수 있어요.",
      "통영 도착 전 연료를 미리 채우세요.",
      "일몰 시간에 맞추면 해안 뷰가 더 좋아요.",
    ],
    cautions: [
      "주말 해안도로 교통량이 많을 수 있습니다.",
      "해안 바람에 체감 온도가 낮아질 수 있어요.",
    ],
    lat: 34.837,
    lng: 127.892,
    rating: 4.8,
    reviewCount: 124,
  },
  {
    id: 2,
    name: "설악·속초 해안 바리",
    region: "강원",
    type: "투어",
    difficulty: "초급",
    distance: "약 120km",
    distanceKm: 120,
    duration: "4~5시간",
    bestSeason: ["여름", "가을"],
    description:
      "속초 해안도로와 설악산 기슭을 연결하는 입문자 친화 코스. 직선·완만한 구간이 많아 첫 바리에 적합합니다.",
    startPoint: "속초",
    endPoint: "양양",
    waypoints: [
      { name: "속초", lat: 38.204, lng: 128.59, note: "출발" },
      { name: "설악산 입구", lat: 38.172, lng: 128.536, note: "산악 뷰" },
      { name: "대포항", lat: 38.122, lng: 128.625, note: "해안 드라이브" },
      { name: "양양", lat: 38.072, lng: 128.622, note: "도착" },
    ],
    highlights: [
      "속초 해변과 설악산 전경",
      "대포항·양양 서핑 비치 인근",
      "초보자도 부담 없는 난이도",
    ],
    tips: [
      "여름 성수기에는 숙소를 미리 예약하세요.",
      "속초 중앙시장에서 간단히 식사 후 출발하기 좋아요.",
    ],
    cautions: ["성수기 주말 교통 체증이 심할 수 있습니다."],
    lat: 38.207,
    lng: 128.592,
    rating: 4.6,
    reviewCount: 98,
  },
  {
    id: 3,
    name: "제주 1132 해안 일주",
    region: "제주",
    type: "일주",
    difficulty: "중급",
    distance: "약 230km",
    distanceKm: 230,
    duration: "6~8시간",
    bestSeason: ["봄", "가을", "겨울"],
    description:
      "제주도 해안 일주도로의 대표 코스. 서쪽 1132번 도로 구간이 특히 인기 있으며, 바람과 해안 풍경이 일품입니다.",
    startPoint: "제주시",
    endPoint: "서귀포",
    waypoints: [
      { name: "제주시", lat: 33.499621, lng: 126.531188, note: "출발" },
      { name: "애월", lat: 33.464408, lng: 126.308397, note: "서쪽 해안 진입" },
      { name: "한림", lat: 33.412192, lng: 126.268768, note: "1132 구간" },
      { name: "성산", lat: 33.458384, lng: 126.942214, note: "동쪽 해안" },
      { name: "서귀포", lat: 33.254121, lng: 126.560076, note: "남쪽 해안 · 도착" },
    ],
    highlights: [
      "애월·한림 서쪽 해안 드라이브",
      "성산일출봉·섭지코지 연계",
      "제주만의 해안·오름 풍경",
    ],
    tips: [
      "제주에서는 바람이 강하니 방한·방풍 준비가 필수예요.",
      "렌트/페리 시간에 맞춰 일정을 짜세요.",
      "연료는 중간중간 채우는 것이 안전합니다.",
    ],
    cautions: [
      "강풍·강우 시 해안도로 주행이 위험할 수 있습니다.",
      "관광지 구간 속도 제한을 지켜주세요.",
    ],
    lat: 33.254,
    lng: 126.56,
    rating: 4.9,
    reviewCount: 156,
  },
  {
    id: 4,
    name: "팔당댐 일주",
    region: "수도권",
    type: "당일치기",
    difficulty: "초급",
    distance: "약 60km",
    distanceKm: 60,
    duration: "2~3시간",
    bestSeason: ["봄", "여름", "가을"],
    description:
      "서울 근교에서 가장 많이 도는 당일치기 코스. 출퇴근 라이더도 부담 없이 다녀올 수 있습니다.",
    startPoint: "남양주",
    endPoint: "남양주",
    waypoints: [
      { name: "남양주", lat: 37.636021, lng: 127.216527, note: "출발" },
      { name: "팔당댐", lat: 37.523112, lng: 127.375284, note: "댐 전망" },
      { name: "청평", lat: 37.735421, lng: 127.426318, note: "북쪽 구간" },
      { name: "양평", lat: 37.491894, lng: 127.487369, note: "남쪽 구간" },
      { name: "남양주", lat: 37.636021, lng: 127.216527, note: "복귀 · 도착" },
    ],
    highlights: [
      "서울에서 1시간 내 접근",
      "댐·호수 풍경",
      "카페·휴게소 많음",
    ],
    tips: [
      "주말 오후에는 인파가 많아요. 이른 아침이 한적합니다.",
      "양평 카페 거리에서 휴식하기 좋아요.",
    ],
    cautions: ["댐 주변 곡선 구간에서 속도를 줄이세요."],
    lat: 37.523,
    lng: 127.375,
    rating: 4.5,
    reviewCount: 210,
  },
  {
    id: 5,
    name: "대관령·평창 산악 바리",
    region: "강원",
    type: "산악",
    difficulty: "상급",
    distance: "약 90km",
    distanceKm: 90,
    duration: "4~5시간",
    bestSeason: ["여름", "가을"],
    description:
      "대관령 고랭지를 넘는 산악 코스. 커브와 고도 변화가 있어 숙련 라이더에게 추천됩니다.",
    startPoint: "강릉",
    endPoint: "평창",
    waypoints: [
      { name: "강릉", lat: 37.751, lng: 128.876, note: "출발" },
      { name: "대관령", lat: 37.675, lng: 128.747, note: "고랭지 구간" },
      { name: "진부", lat: 37.658, lng: 128.558, note: "산악 커브" },
      { name: "평창", lat: 37.37, lng: 128.39, note: "도착" },
    ],
    highlights: [
      "대관령 고랭지 풍경",
      "산악 커브와 오르막·내리막",
      "평창 올림픽 파크 인근",
    ],
    tips: [
      "기온 변화가 크니 겹쳐 입으세요.",
      "오전 이른 출발이 안개·교통 모두 유리합니다.",
    ],
    cautions: [
      "겨울 결빙·적설 시 통행이 제한될 수 있습니다.",
      "산악 구간에서 무리한 추월은 피하세요.",
    ],
    lat: 37.675,
    lng: 128.747,
    rating: 4.7,
    reviewCount: 67,
  },
  {
    id: 6,
    name: "동해·삼척 해안도로",
    region: "강원",
    type: "해안",
    difficulty: "중급",
    distance: "약 100km",
    distanceKm: 100,
    duration: "3~4시간",
    bestSeason: ["봄", "여름", "가을"],
    description:
      "동해안을 따라 북쪽으로 이어지는 해안 드라이브. 맑은 날 바다색이 특히 아름답습니다.",
    startPoint: "동해",
    endPoint: "삼척",
    waypoints: [
      { name: "동해", lat: 37.524, lng: 129.114, note: "출발" },
      { name: "묵호", lat: 37.581, lng: 129.117, note: "해안 드라이브" },
      { name: "삼척", lat: 37.45, lng: 129.165, note: "도착" },
    ],
    highlights: [
      "에메랄드빛 동해 전망",
      "묵호·삼척 해변 연계",
      "비교적 한적한 해안도로",
    ],
    tips: ["맑은 날 오전에 출발하면 바다색이 가장 선명해요."],
    cautions: ["해안 바람이 강할 수 있어요."],
    lat: 37.524,
    lng: 129.114,
    rating: 4.6,
    reviewCount: 82,
  },
  {
    id: 7,
    name: "경주·포항 해안 바리",
    region: "경북",
    type: "해안",
    difficulty: "중급",
    distance: "약 110km",
    distanceKm: 110,
    duration: "4시간",
    bestSeason: ["봄", "가을"],
    description:
      "경주 문화유적과 포항 해안을 연결하는 동해안 코스. 역사·바다를 함께 즐길 수 있습니다.",
    startPoint: "경주",
    endPoint: "포항",
    waypoints: [
      { name: "경주", lat: 35.856, lng: 129.225, note: "출발 · 불국사 인근" },
      { name: "울산", lat: 35.538, lng: 129.311, note: "중간 경유" },
      { name: "포항", lat: 36.019, lng: 129.343, note: "도착 · 호미곶" },
    ],
    highlights: [
      "경주 역사 명소 연계",
      "포항 호미곶 일출 명소",
      "동해안 해안선 드라이브",
    ],
    tips: ["경주 관광과 함께 1박 2일 일정도 좋아요."],
    cautions: ["경주·포항 간 국도 구간 교통량 확인."],
    lat: 36.019,
    lng: 129.343,
    rating: 4.4,
    reviewCount: 54,
  },
  {
    id: 8,
    name: "지리산 둘레 바리",
    region: "전남",
    type: "산악",
    difficulty: "상급",
    distance: "약 150km",
    distanceKm: 150,
    duration: "5~6시간",
    bestSeason: ["가을"],
    description:
      "지리산 자락을 도는 산악 바리 코스. 가을 단풍 시즌에 특히 인기가 많습니다.",
    startPoint: "구례",
    endPoint: "하동",
    waypoints: [
      { name: "구례", lat: 35.202, lng: 127.462, note: "출발" },
      { name: "섬진강", lat: 35.065, lng: 127.489, note: "강변 구간" },
      { name: "하동", lat: 35.067, lng: 127.751, note: "도착 · 녹차밭" },
    ],
    highlights: [
      "지리산 능선 전망",
      "가을 단풍 명소",
      "하동 녹차밭·차 문화",
    ],
    tips: [
      "단풍 시즌(10월)에는 일찍 출발하세요.",
      "하동에서 녹차·식사 후 귀환하기 좋아요.",
    ],
    cautions: [
      "산악 구간 안개·급커브 주의.",
      "야간 주행은 피하는 것이 좋습니다.",
    ],
    lat: 35.202,
    lng: 127.462,
    rating: 4.8,
    reviewCount: 73,
  },
];

export function getRouteById(
  routes: BariRoute[],
  id: number
): BariRoute | undefined {
  return routes.find((route) => route.id === id);
}

export function filterRoutes(
  routes: BariRoute[],
  options: {
    region?: string;
    difficulty?: RouteDifficulty | "전체";
    type?: RouteType | "전체";
    query?: string;
  }
): BariRoute[] {
  const { region = "전체", difficulty = "전체", type = "전체", query = "" } =
    options;

  return routes.filter((route) => {
    if (!matchesDetailRegion(route.region, region)) return false;
    if (difficulty !== "전체" && route.difficulty !== difficulty) return false;
    if (type !== "전체" && route.type !== type) return false;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const searchable = [
        route.name,
        route.region,
        route.description,
        route.startPoint,
        route.endPoint,
        ...route.highlights,
      ]
        .join(" ")
        .toLowerCase();

      if (!searchable.includes(q)) return false;
    }

    return true;
  });
}
