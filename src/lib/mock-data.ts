export type BoardPost = {
  id: number;
  category: string;
  title: string;
  author: string;
  date: string;
  views: number;
  comments: number;
};

export type GalleryItem = {
  id: number;
  title: string;
  author: string;
  location: string;
  likes: number;
  emoji: string;
};

export type RidingSpot = {
  id: number;
  name: string;
  region: string;
  description: string;
  distance: string;
  lat: number;
  lng: number;
};

export const boardPosts: BoardPost[] = [
  {
    id: 1,
    category: "자유",
    title: "이번 주말 강원도 라이딩 같이 가실 분?",
    author: "바람탄라이더",
    date: "2026-07-04",
    views: 128,
    comments: 14,
  },
  {
    id: 2,
    category: "정비",
    title: "체인 청소 주기 어떻게 관리하세요?",
    author: "정비초보",
    date: "2026-07-03",
    views: 89,
    comments: 7,
  },
  {
    id: 3,
    category: "코스",
    title: "남해 일주 추천 코스 공유합니다",
    author: "해안로매니아",
    date: "2026-07-02",
    views: 203,
    comments: 21,
  },
  {
    id: 4,
    category: "장비",
    title: "여름용 메쉬 자켓 추천 부탁드려요",
    author: "썸머라이더",
    date: "2026-07-01",
    views: 156,
    comments: 18,
  },
  {
    id: 5,
    category: "모임",
    title: "서울 강서구 정기 라이딩 모임 7월 일정",
    author: "강서크루",
    date: "2026-06-30",
    views: 74,
    comments: 5,
  },
];

export const galleryItems: GalleryItem[] = [
  {
    id: 1,
    title: "속초 해변 일출 라이딩",
    author: "새벽라이더",
    location: "강원 속초",
    likes: 42,
    emoji: "🌅",
  },
  {
    id: 2,
    title: "지리산 능선 코스 인증샷",
    author: "산악크루",
    location: "전남 구례",
    likes: 38,
    emoji: "⛰️",
  },
  {
    id: 3,
    title: "제주 해안도로 투어",
    author: "제주라이더",
    location: "제주 서귀포",
    likes: 55,
    emoji: "🌊",
  },
  {
    id: 4,
    title: "가을 단풍 라이딩",
    author: "단풍매니아",
    location: "충북 제천",
    likes: 29,
    emoji: "🍁",
  },
  {
    id: 5,
    title: "첫 바이크 데뷔 기념",
    author: "신입라이더",
    location: "경기 용인",
    likes: 61,
    emoji: "🏍️",
  },
  {
    id: 6,
    title: "크루 단체 라이딩",
    author: "서울크루",
    location: "서울 한강",
    likes: 47,
    emoji: "👥",
  },
];

export const ridingSpots: RidingSpot[] = [
  {
    id: 1,
    name: "남해 해안도로",
    region: "경남 남해",
    description: "완만한 커브와 바다 전망이 좋은 인기 코스",
    distance: "약 120km",
    lat: 34.8376,
    lng: 127.8922,
  },
  {
    id: 2,
    name: "설악산 동해 방향",
    region: "강원 속초",
    description: "초보자도 즐기기 좋은 해안·산악 복합 코스",
    distance: "약 80km",
    lat: 38.207,
    lng: 128.5918,
  },
  {
    id: 3,
    name: "제주 1132 도로",
    region: "제주 서귀포",
    description: "제주 서쪽 해안을 따라 달리는 대표 라이딩 루트",
    distance: "약 95km",
    lat: 33.2541,
    lng: 126.56,
  },
  {
    id: 4,
    name: "팔당댐 일주",
    region: "경기 남양주",
    description: "서울 근교 당일치기 라이딩에 적합",
    distance: "약 60km",
    lat: 37.523,
    lng: 127.375,
  },
];

export const weatherPreview = {
  location: "서울",
  temperature: 28,
  condition: "맑음",
  wind: "남서풍 3m/s",
  humidity: "62%",
  ridingTip: "오후에 소나기 가능성이 있어 우비를 챙기면 좋아요.",
};
