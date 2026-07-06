export type PlaceCategory =
  | "cafe"
  | "restaurant"
  | "fuel"
  | "repair"
  | "viewpoint"
  | "parking";

export type PromotionTier = "basic" | "premium";

export type PlacePromotion = {
  tier: PromotionTier;
  headline: string;
  offer?: string;
  featuredUntil?: string;
  badge?: string;
};

export type RoutePlaceLink = {
  routeId: number;
  sortOrder: number;
  note?: string;
};

/** 코스·지도·제휴 홍보에 공통으로 쓰는 장소 데이터 */
export type RiderPlace = {
  id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  address: string;
  region: string;
  description: string;
  amenities: string[];
  openHours?: string;
  phone?: string;
  routeLinks: RoutePlaceLink[];
  isPartner: boolean;
  promotion?: PlacePromotion;
  /** 추후 사장님 계정과 연결 */
  ownerId?: string;
  status: "active" | "pending" | "draft";
};

export type PartnerPlan = {
  id: PromotionTier;
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

export const placeCategoryLabels: Record<PlaceCategory, string> = {
  cafe: "라이더 카페",
  restaurant: "식당",
  fuel: "주유소",
  repair: "정비소",
  viewpoint: "전망·명소",
  parking: "주차·휴게",
};

export const placeCategoryEmoji: Record<PlaceCategory, string> = {
  cafe: "☕",
  restaurant: "🍽️",
  fuel: "⛽",
  repair: "🔧",
  viewpoint: "📸",
  parking: "🅿️",
};

export const partnerPlans: PartnerPlan[] = [
  {
    id: "basic",
    name: "베이직",
    price: "월 29,000원",
    description: "코스 주변 라이더들에게 매장을 알리는 기본 홍보",
    features: [
      "코스 상세 페이지 장소 등록",
      "지도 마커 노출",
      "기본 매장 정보·운영 시간",
      "라이더 혜택 1개 등록",
    ],
  },
  {
    id: "premium",
    name: "프리미엄",
    price: "월 59,000원",
    description: "우선 노출과 이벤트로 방문을 유도하는 확장 홍보",
    features: [
      "베이직 기능 전체",
      "코스 목록·홈 추천 우선 노출",
      "프리미엄 배지·이벤트 배너",
      "여러 코스 동시 연결",
      "월간 조회·클릭 리포트(예정)",
    ],
    highlighted: true,
  },
];

export const riderPlaces: RiderPlace[] = [
  {
    id: "cafe-namhae-wind",
    name: "바람카페 남해",
    category: "cafe",
    lat: 34.812,
    lng: 127.905,
    address: "경남 남해군 설리면 설리로",
    region: "경상",
    description: "바이크 주차 공간이 넓고 해안 뷰가 좋은 라이더 카페.",
    amenities: ["바이크 주차", "테라스", "음료·디저트"],
    openHours: "09:00 - 19:00",
    routeLinks: [{ routeId: 1, sortOrder: 1, note: "설리 구간 휴식 추천" }],
    isPartner: true,
    promotion: {
      tier: "premium",
      headline: "라이더 음료 10% 할인",
      offer: "헬멧 착용 후 방문 시 음료 10% 할인",
      badge: "프리미엄 제휴",
    },
    status: "active",
  },
  {
    id: "rest-tongyeong-harbor",
    name: "통영 항구식당",
    category: "restaurant",
    lat: 34.845,
    lng: 128.42,
    address: "경남 통영시 항만로",
    region: "경상",
    description: "코스 종착 후 회·해물로 마무리하기 좋은 식당.",
    amenities: ["주차", "단체석", "해물 요리"],
    openHours: "11:00 - 21:00",
    routeLinks: [{ routeId: 1, sortOrder: 2, note: "종착 후 식사" }],
    isPartner: true,
    promotion: {
      tier: "basic",
      headline: "라이더 런치 세트",
      offer: "바리 코스 인증 시 런치 세트 2,000원 할인",
      badge: "제휴 매장",
    },
    status: "active",
  },
  {
    id: "cafe-sokcho-rider",
    name: "속초 라이더 카페",
    category: "cafe",
    lat: 38.198,
    lng: 128.585,
    address: "강원 속초시 중앙로",
    region: "강원",
    description: "출발 전 커피 한 잔과 라이더 모임 공간.",
    amenities: ["바이크 주차", "Wi-Fi", "모임 공간"],
    openHours: "08:00 - 20:00",
    routeLinks: [{ routeId: 2, sortOrder: 1, note: "출발 전 집결" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "cafe-jeju-aewol",
    name: "애월 바이크 카페",
    category: "cafe",
    lat: 33.461,
    lng: 126.315,
    address: "제주 제주시 애월읍",
    region: "제주",
    description: "1132 해안도로 중간 휴식에 인기 있는 카페.",
    amenities: ["바이크 주차", "오션뷰", "충전 콘센트"],
    openHours: "10:00 - 18:00",
    routeLinks: [{ routeId: 3, sortOrder: 1, note: "서쪽 해안 중간 휴식" }],
    isPartner: true,
    promotion: {
      tier: "premium",
      headline: "아메리카노 1+1",
      offer: "2인 이상 라이더 방문 시 아메리카노 1+1",
      badge: "프리미엄 제휴",
    },
    status: "active",
  },
  {
    id: "cafe-paldang-stop",
    name: "팔당 라이더 스톱",
    category: "cafe",
    lat: 37.528,
    lng: 127.368,
    address: "경기 남양주시 팔당면",
    region: "서울·경기",
    description: "팔당댐 일주 코스의 대표 휴식 거점.",
    amenities: ["바이크 주차", "간식", "화장실"],
    openHours: "07:00 - 21:00",
    routeLinks: [{ routeId: 4, sortOrder: 1, note: "댐 구간 필수 휴식" }],
    isPartner: true,
    promotion: {
      tier: "basic",
      headline: "라이더 할인",
      offer: "음료 500원 할인",
      badge: "제휴 매장",
    },
    status: "active",
  },
  {
    id: "cafe-yangpyeong",
    name: "양평 카페거리 라운지",
    category: "cafe",
    lat: 37.488,
    lng: 127.492,
    address: "경기 양평군 양평읍",
    region: "서울·경기",
    description: "코스 후반부 카페거리에서 여유롭게 쉬기 좋은 곳.",
    amenities: ["주차", "브런치", "야외석"],
    openHours: "09:30 - 20:30",
    routeLinks: [{ routeId: 4, sortOrder: 2, note: "귀환 전 휴식" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "view-daegwallyeong",
    name: "대관령 전망 휴게소",
    category: "viewpoint",
    lat: 37.678,
    lng: 128.745,
    address: "강원 평창군 대관령면",
    region: "강원",
    description: "고랭지 전망과 사진 스팟.",
    amenities: ["주차", "전망대", "간단 매점"],
    routeLinks: [{ routeId: 5, sortOrder: 1, note: "고랭지 구간 전망" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "cafe-donghae-coast",
    name: "동해 바람 카페",
    category: "cafe",
    lat: 37.531,
    lng: 129.108,
    address: "강원 동해시 해안로",
    region: "강원",
    description: "동해 출발 전 커피와 간단 식사.",
    amenities: ["바이크 주차", "해안 뷰"],
    openHours: "08:30 - 19:00",
    routeLinks: [{ routeId: 6, sortOrder: 1, note: "출발 전" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "cafe-hadong-tea",
    name: "하동 녹차 카페",
    category: "cafe",
    lat: 35.065,
    lng: 127.748,
    address: "경남 하동군 하동읍",
    region: "전라",
    description: "지리산 코스 종착 후 녹차 디저트.",
    amenities: ["주차", "녹차·디저트", "야외 정원"],
    openHours: "09:00 - 18:00",
    routeLinks: [{ routeId: 8, sortOrder: 1, note: "종착 후 휴식" }],
    isPartner: true,
    promotion: {
      tier: "basic",
      headline: "녹차 아이스크림 증정",
      offer: "2인 이상 방문 시 디저트 1개 증정",
      badge: "제휴 매장",
    },
    status: "active",
  },
  {
    id: "fuel-changwon-start",
    name: "마산 라이더 주유소",
    category: "fuel",
    lat: 35.225,
    lng: 128.575,
    address: "경남 창원시 마산합포구",
    region: "경상",
    description: "남해 코스 출발 전 연료·공기압 점검하기 좋은 24시간 주유소.",
    amenities: ["24시간", "세차", "공기압", "간단 매점"],
    openHours: "24시간",
    routeLinks: [{ routeId: 1, sortOrder: 0, note: "출발 전 연료 보충" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "cafe-namhae-german",
    name: "독일마을 전망 카페",
    category: "cafe",
    lat: 34.776,
    lng: 127.955,
    address: "경남 남해군 삼동면 독일마을",
    region: "경상",
    description: "남해 독일마을 전망과 함께 쉬어가는 인기 스팟.",
    amenities: ["전망 테라스", "바이크 주차", "브런치"],
    openHours: "10:00 - 19:00",
    routeLinks: [{ routeId: 1, sortOrder: 3, note: "독일마을 구간 휴식" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "view-namhae-geoga",
    name: "남해 고생대로 전망대",
    category: "viewpoint",
    lat: 34.795,
    lng: 127.88,
    address: "경남 남해군 설리면",
    region: "경상",
    description: "바다와 섬이 한눈에 보이는 대표 포토 스팟.",
    amenities: ["주차", "전망대", "포토존"],
    routeLinks: [{ routeId: 1, sortOrder: 4, note: "인증샷 명소" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "cafe-sokcho-fish-market",
    name: "속초 중앙시장 라이더 푸드",
    category: "restaurant",
    lat: 38.204,
    lng: 128.59,
    address: "강원 속초시 중앙시장로",
    region: "강원",
    description: "아침 출발 전 속초 닭강정·아바이순대로 든든하게.",
    amenities: ["아침 영업", "포장", "주차"],
    openHours: "06:00 - 14:00",
    routeLinks: [{ routeId: 2, sortOrder: 0, note: "출발 전 아침 식사" }],
    isPartner: true,
    promotion: {
      tier: "basic",
      headline: "라이더 아침 세트",
      offer: "2인 이상 주문 시 음료 무료",
      badge: "제휴 매장",
    },
    status: "active",
  },
  {
    id: "cafe-daepo-sunset",
    name: "대포항 선셋 카페",
    category: "cafe",
    lat: 38.122,
    lng: 128.625,
    address: "강원 속초시 대포항",
    region: "강원",
    description: "대포항 바다를 바라보며 쉬는 해안 카페.",
    amenities: ["오션뷰", "바이크 주차", "디저트"],
    openHours: "09:00 - 20:00",
    routeLinks: [{ routeId: 2, sortOrder: 2, note: "해안 구간 휴식" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "cafe-yangyang-surf",
    name: "양양 서핑비치 라운지",
    category: "cafe",
    lat: 38.072,
    lng: 128.622,
    address: "강원 양양군 현남면",
    region: "강원",
    description: "코스 종착 후 해변과 함께 여유롭게 마무리.",
    amenities: ["해변 접근", "샤워실", "음료·맥주"],
    openHours: "10:00 - 22:00",
    routeLinks: [{ routeId: 2, sortOrder: 3, note: "종착 후 휴식" }],
    isPartner: true,
    promotion: {
      tier: "premium",
      headline: "음료 2잔째 50%",
      offer: "라이더 2인 이상 방문 시 적용",
      badge: "프리미엄 제휴",
    },
    status: "active",
  },
  {
    id: "parking-sokcho-rest",
    name: "속초 해안 휴게 주차장",
    category: "parking",
    lat: 38.19,
    lng: 128.6,
    address: "강원 속초시 조양동",
    region: "강원",
    description: "해안가 잠시 멈춰 바람 쐬기 좋은 휴게 공간.",
    amenities: ["넓은 주차", "화장실", "편의점"],
    routeLinks: [{ routeId: 2, sortOrder: 4, note: "중간 휴식" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "cafe-jeju-city-rider",
    name: "제주시 라이더 출발점",
    category: "cafe",
    lat: 33.501,
    lng: 126.528,
    address: "제주 제주시 연동",
    region: "제주",
    description: "제주 일주 출발 전 집결·브리핑하기 좋은 카페.",
    amenities: ["바이크 주차", "Wi-Fi", "지도·코스 안내"],
    openHours: "07:00 - 21:00",
    routeLinks: [{ routeId: 3, sortOrder: 0, note: "출발 전 집결" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "view-jeju-hallim",
    name: "한림 해안 전망 포인트",
    category: "viewpoint",
    lat: 33.41,
    lng: 126.265,
    address: "제주 제주시 한림읍",
    region: "제주",
    description: "1132번 도로 대표 뷰 포인트. 에메랄드빛 바다.",
    amenities: ["주차", "포토존"],
    routeLinks: [{ routeId: 3, sortOrder: 2, note: "1132 핵심 구간" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "rest-seogwipo-harbor",
    name: "서귀포 항구 횟집",
    category: "restaurant",
    lat: 33.248,
    lng: 126.565,
    address: "제주 서귀포시 중정로",
    region: "제주",
    description: "남쪽 해안 구간 후 신선한 회로 점심.",
    amenities: ["주차", "회·해물", "단체석"],
    openHours: "11:00 - 21:00",
    routeLinks: [{ routeId: 3, sortOrder: 3, note: "남부 구간 점심" }],
    isPartner: true,
    promotion: {
      tier: "basic",
      headline: "라이더 런치 특선",
      offer: "헬멧 착용 시 반찬 1종 추가",
      badge: "제휴 매장",
    },
    status: "active",
  },
  {
    id: "view-jeju-seongsan",
    name: "성산일출봉 전망",
    category: "viewpoint",
    lat: 33.456,
    lng: 126.938,
    address: "제주 서귀포시 성산읍",
    region: "제주",
    description: "동쪽 해안 일주 필수 코스. 일출봉 전경.",
    amenities: ["주차", "전망", "카페 인근"],
    routeLinks: [{ routeId: 3, sortOrder: 4, note: "동쪽 해안 명소" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "fuel-jeju-mid",
    name: "중간 지점 EV·주유 스테이션",
    category: "fuel",
    lat: 33.38,
    lng: 126.42,
    address: "제주 서귀포시 남원읍",
    region: "제주",
    description: "제주 일주 중간 연료 보충·휴식.",
    amenities: ["주유", "충전", "매점", "화장실"],
    openHours: "24시간",
    routeLinks: [{ routeId: 3, sortOrder: 5, note: "중간 연료 보충" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "fuel-namyangju-start",
    name: "남양주 출발 주유소",
    category: "fuel",
    lat: 37.634,
    lng: 127.21,
    address: "경기 남양주시",
    region: "서울·경기",
    description: "팔당 코스 시작 전 연료·타이어 점검.",
    amenities: ["24시간", "공기압", "세차"],
    openHours: "24시간",
    routeLinks: [{ routeId: 4, sortOrder: 0, note: "출발 전" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "cafe-cheongpyeong-lake",
    name: "청평호수 카페",
    category: "cafe",
    lat: 37.732,
    lng: 127.42,
    address: "경기 가평군 청평면",
    region: "서울·경기",
    description: "북쪽 루프 구간 호수 뷰 카페.",
    amenities: ["호수 뷰", "주차", "브런치"],
    openHours: "09:00 - 20:00",
    routeLinks: [{ routeId: 4, sortOrder: 3, note: "북쪽 루프 휴식" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "view-paldang-dam",
    name: "팔당댐 전망대",
    category: "viewpoint",
    lat: 37.52,
    lng: 127.372,
    address: "경기 남양주시 팔당면",
    region: "서울·경기",
    description: "팔당호 전경을 담기 좋은 대표 스팟.",
    amenities: ["주차", "전망대"],
    routeLinks: [{ routeId: 4, sortOrder: 4, note: "댐 전경" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "cafe-gangneung-rider",
    name: "강릉 커피거리 라이더점",
    category: "cafe",
    lat: 37.749,
    lng: 128.872,
    address: "강원 강릉시 안목해변",
    region: "강원",
    description: "대관령 코스 출발 전 강릉 커피거리.",
    amenities: ["바이크 주차", "커피", "해변 접근"],
    openHours: "08:00 - 21:00",
    routeLinks: [{ routeId: 5, sortOrder: 0, note: "출발 전" }],
    isPartner: true,
    promotion: {
      tier: "basic",
      headline: "아메리카노 500원 할인",
      badge: "제휴 매장",
    },
    status: "active",
  },
  {
    id: "repair-jinbu-bike",
    name: "진부 바이크 정비",
    category: "repair",
    lat: 37.655,
    lng: 128.555,
    address: "강원 평창군 진부면",
    region: "강원",
    description: "산악 구간 전 간단 정비·타이어 공기압.",
    amenities: ["타이어", "체인", "공구 대여"],
    openHours: "09:00 - 18:00",
    routeLinks: [{ routeId: 5, sortOrder: 2, note: "산악 구간 전 점검" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "rest-pyeongchang-olympic",
    name: "평창 올림픽파크 식당",
    category: "restaurant",
    lat: 37.365,
    lng: 128.395,
    address: "강원 평창군 대관령면",
    region: "강원",
    description: "코스 종착 후 평창에서 따뜻한 식사.",
    amenities: ["주차", "한식", "단체석"],
    openHours: "11:00 - 20:00",
    routeLinks: [{ routeId: 5, sortOrder: 3, note: "종착 후 식사" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "cafe-mukho-port",
    name: "묵호항 바람 카페",
    category: "cafe",
    lat: 37.578,
    lng: 129.115,
    address: "강원 동해시 묵호항",
    region: "강원",
    description: "묵호항 바다와 등대를 보며 쉬는 카페.",
    amenities: ["오션뷰", "바이크 주차", "디저트"],
    openHours: "09:00 - 19:00",
    routeLinks: [{ routeId: 6, sortOrder: 2, note: "묵호 구간" }],
    isPartner: true,
    promotion: {
      tier: "basic",
      headline: "음료 10% 할인",
      badge: "제휴 매장",
    },
    status: "active",
  },
  {
    id: "view-samcheok-coast",
    name: "삼척 해안 드라이브 포인트",
    category: "viewpoint",
    lat: 37.448,
    lng: 129.16,
    address: "강원 삼척시 근덕면",
    region: "강원",
    description: "동해안 에메랄드빛 바다가 펼쳐지는 구간.",
    amenities: ["주차", "포토존"],
    routeLinks: [{ routeId: 6, sortOrder: 3, note: "해안 전망" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "rest-samcheok-cave",
    name: "삼척 해물 식당",
    category: "restaurant",
    lat: 37.442,
    lng: 129.168,
    address: "강원 삼척시",
    region: "강원",
    description: "코스 종착 후 삼척에서 해물로 마무리.",
    amenities: ["주차", "해물탕", "단체석"],
    openHours: "11:00 - 21:00",
    routeLinks: [{ routeId: 6, sortOrder: 4, note: "종착 후 식사" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "fuel-donghae-mid",
    name: "동해 중간 주유소",
    category: "fuel",
    lat: 37.527,
    lng: 129.112,
    address: "강원 동해시",
    region: "강원",
    description: "동해·삼척 코스 중간 연료 보충.",
    amenities: ["24시간", "매점"],
    openHours: "24시간",
    routeLinks: [{ routeId: 6, sortOrder: 5, note: "연료 보충" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "cafe-gyeongju-rider",
    name: "경주 라이더 카페",
    category: "cafe",
    lat: 35.852,
    lng: 129.22,
    address: "경북 경주시 보문로",
    region: "경상",
    description: "경주 출발 전 커피와 간단 식사.",
    amenities: ["바이크 주차", "Wi-Fi", "브런치"],
    openHours: "08:00 - 20:00",
    routeLinks: [{ routeId: 7, sortOrder: 0, note: "출발 전" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "view-gyeongju-bulguksa",
    name: "불국사 전망 휴게",
    category: "viewpoint",
    lat: 35.79,
    lng: 129.332,
    address: "경북 경주시 불국로",
    region: "경상",
    description: "경주 역사와 함께 잠시 멈추기 좋은 구간.",
    amenities: ["주차", "문화유적", "카페 인근"],
    routeLinks: [{ routeId: 7, sortOrder: 1, note: "경주 관광 연계" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "cafe-ulsan-bridge",
    name: "울산 대교 뷰 카페",
    category: "cafe",
    lat: 35.535,
    lng: 129.305,
    address: "울산 남구 삼산동",
    region: "경상",
    description: "울산 경유 구간 바다 전망 카페.",
    amenities: ["전망", "주차", "음료"],
    openHours: "09:00 - 21:00",
    routeLinks: [{ routeId: 7, sortOrder: 2, note: "중간 경유 휴식" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "view-pohang-homigot",
    name: "호미곶 해맞이광장",
    category: "viewpoint",
    lat: 36.058,
    lng: 129.565,
    address: "경북 포항시 호미곶면",
    region: "경상",
    description: "한반도 최동단 상생의 손. 일출·바다 명소.",
    amenities: ["주차", "전망", "기념품"],
    routeLinks: [{ routeId: 7, sortOrder: 3, note: "종착 명소" }],
    isPartner: true,
    promotion: {
      tier: "premium",
      headline: "기념품 10% 할인",
      offer: "라이더모임 방문 인증 시",
      badge: "프리미엄 제휴",
    },
    status: "active",
  },
  {
    id: "rest-pohang-seafood",
    name: "포항 구룡포 횟집",
    category: "restaurant",
    lat: 36.015,
    lng: 129.555,
    address: "경북 포항시 남구",
    region: "경상",
    description: "과메기·회로 유명한 포항 종착 식당.",
    amenities: ["주차", "회·해산물", "단체석"],
    openHours: "11:00 - 22:00",
    routeLinks: [{ routeId: 7, sortOrder: 4, note: "종착 후 식사" }],
    isPartner: true,
    promotion: {
      tier: "basic",
      headline: "과메기 세트 할인",
      offer: "2인 이상 주문 시 음료 제공",
      badge: "제휴 매장",
    },
    status: "active",
  },
  {
    id: "cafe-gurye-start",
    name: "구례 라이더 출발 카페",
    category: "cafe",
    lat: 35.198,
    lng: 127.458,
    address: "전남 구례군 구례읍",
    region: "전라",
    description: "지리산 코스 출발 전 집결·커피.",
    amenities: ["바이크 주차", "Wi-Fi", "간식"],
    openHours: "07:00 - 19:00",
    routeLinks: [{ routeId: 8, sortOrder: 0, note: "출발 전" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "view-jirisan-ridge",
    name: "지리산 능선 전망",
    category: "viewpoint",
    lat: 35.08,
    lng: 127.48,
    address: "전남 구례군 토지면",
    region: "전라",
    description: "지리산 능선과 계곡이 보이는 구간.",
    amenities: ["주차", "포토존"],
    routeLinks: [{ routeId: 8, sortOrder: 2, note: "산악 전망" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "rest-gurye-temple",
    name: "구례 섬진강 식당",
    category: "restaurant",
    lat: 35.068,
    lng: 127.485,
    address: "전남 구례군",
    region: "전라",
    description: "섬진강 재첩국·민물매운탕으로 든든하게.",
    amenities: ["주차", "한식", "단체석"],
    openHours: "10:00 - 20:00",
    routeLinks: [{ routeId: 8, sortOrder: 3, note: "중간 점심" }],
    isPartner: false,
    status: "active",
  },
  {
    id: "repair-hadong-stop",
    name: "하동 바이크 쉼터",
    category: "repair",
    lat: 35.062,
    lng: 127.742,
    address: "경남 하동군",
    region: "전라",
    description: "종착 전 간단 점검·공기압 보충.",
    amenities: ["공기압", "세척", "휴게"],
    openHours: "09:00 - 18:00",
    routeLinks: [{ routeId: 8, sortOrder: 4, note: "종착 전 점검" }],
    isPartner: false,
    status: "active",
  },
];

export function getPlacesForRoute(routeId: number): RiderPlace[] {
  return riderPlaces
    .filter(
      (place) =>
        place.status === "active" &&
        place.routeLinks.some((link) => link.routeId === routeId)
    )
    .sort((a, b) => {
      const orderA =
        a.routeLinks.find((link) => link.routeId === routeId)?.sortOrder ?? 0;
      const orderB =
        b.routeLinks.find((link) => link.routeId === routeId)?.sortOrder ?? 0;
      return orderA - orderB;
    });
}

export function getRouteLinkNote(place: RiderPlace, routeId: number): string | undefined {
  return place.routeLinks.find((link) => link.routeId === routeId)?.note;
}

export function getPartnerPlaces(): RiderPlace[] {
  return riderPlaces.filter((place) => place.isPartner && place.status === "active");
}

export function getPlaceById(id: string): RiderPlace | undefined {
  return riderPlaces.find((place) => place.id === id);
}

export function getPlacesByCategory(category: PlaceCategory): RiderPlace[] {
  return riderPlaces.filter(
    (place) => place.category === category && place.status === "active"
  );
}

export function getActivePlaceCount(): number {
  return riderPlaces.filter((place) => place.status === "active").length;
}

export function getPlaceCountForRoute(routeId: number): number {
  return getPlacesForRoute(routeId).length;
}

/** 추후 DB/API로 교체할 장소 등록 요청 타입 */
export type PlaceRegistrationRequest = {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  category: PlaceCategory;
  address: string;
  routeIds: number[];
  description: string;
  promotionHeadline?: string;
  planId: PromotionTier;
};

export const emptyRegistrationRequest: PlaceRegistrationRequest = {
  businessName: "",
  ownerName: "",
  email: "",
  phone: "",
  category: "cafe",
  address: "",
  routeIds: [],
  description: "",
  promotionHeadline: "",
  planId: "basic",
};
