import {
  emptyWeeklyOpenHours,
  formatTodayOpenHours,
  formatWeeklyOpenHoursSummary,
  migrateLegacyOpenHours,
  normalizeWeeklyOpenHours,
  parseWeeklyOpenHoursFromBody,
  type WeeklyOpenHours,
} from "@/lib/rider-cafe-hours";
import { matchesDetailRegion, normalizeDetailRegion } from "@/lib/regions";

export const riderCafeCategories = [
  "전체",
  "수도권",
  "강원",
  "충남",
  "충북",
  "전남",
  "전북",
  "경남",
  "경북",
  "제주",
] as const;

export type RiderCafeRegion = Exclude<
  (typeof riderCafeCategories)[number],
  "전체"
>;

const LEGACY_CAFE_REGIONS = new Set([
  "충청",
  "전라",
  "경상",
  "서울·경기",
]);

export function isLegacyCafeRegion(region: string): boolean {
  return LEGACY_CAFE_REGIONS.has(region);
}

export function inferCafeRegionFromAddress(
  address: string
): RiderCafeRegion | null {
  const checks: Array<[RiderCafeRegion, string[]]> = [
    ["수도권", ["서울", "경기", "인천"]],
    ["강원", ["강원"]],
    ["충남", ["충남", "충청남", "대전"]],
    ["충북", ["충북", "충청북", "세종"]],
    ["전남", ["전남", "전라남", "광주"]],
    ["전북", ["전북", "전라북"]],
    ["경남", ["경남", "경상남", "부산", "울산"]],
    ["경북", ["경북", "경상북", "대구"]],
    ["제주", ["제주"]],
  ];

  for (const [region, keywords] of checks) {
    if (keywords.some((keyword) => address.includes(keyword))) {
      return region;
    }
  }

  return null;
}

export function migrateRiderCafeRegion(
  region: string,
  address: string
): RiderCafeRegion {
  if (
    riderCafeCategories.includes(region as (typeof riderCafeCategories)[number]) &&
    region !== "전체"
  ) {
    return region as RiderCafeRegion;
  }

  const fromAddress = inferCafeRegionFromAddress(address);
  if (fromAddress) return fromAddress;

  const legacyFallback: Record<string, RiderCafeRegion> = {
    "서울·경기": "수도권",
    충청: "충남",
    전라: "전남",
    경상: "경남",
  };

  return legacyFallback[region] ?? "수도권";
}

export type { WeeklyOpenHours, WeekDay, DayOpenHours } from "@/lib/rider-cafe-hours";
export {
  WEEK_DAYS,
  WEEK_DAY_LABELS,
  emptyWeeklyOpenHours,
  formatDayOpenHours,
  formatTodayOpenHours,
  formatWeeklyOpenHoursSummary,
  applyWeeklyHoursToAllDays,
} from "@/lib/rider-cafe-hours";

export type RiderCafeBusinessInfo = {
  phone?: string;
  weeklyHours?: WeeklyOpenHours;
  closedDays?: string;
  directions?: string;
  website?: string;
};

export type RiderCafeEntry = {
  id: string;
  name: string;
  author: string;
  authorId?: string;
  address: string;
  region: RiderCafeRegion;
  imageUrl: string;
  description?: string;
  amenities?: string[];
  phone?: string;
  weeklyHours?: WeeklyOpenHours;
  closedDays?: string;
  directions?: string;
  website?: string;
  likes: number;
  /** 서버 전용 — API 응답에서는 제거 */
  likedBy?: string[];
  views: number;
  createdAt: string;
};

/** @deprecated legacy JSON field — migrated to weeklyHours on read */
type LegacyRiderCafeEntry = RiderCafeEntry & {
  openHours?: string;
  region?: string;
};

export type CreateRiderCafeInput = {
  name: string;
  author: string;
  authorId: string;
  address: string;
  region: RiderCafeRegion;
  imageUrl: string;
  description?: string;
  amenities?: string[];
} & RiderCafeBusinessInfo;

export type UpdateRiderCafeInput = {
  name?: string;
  author?: string;
  address?: string;
  region?: RiderCafeRegion;
  imageUrl?: string;
  description?: string;
  amenities?: string[];
} & RiderCafeBusinessInfo;

export function parseRiderCafeBusinessFields(
  body: Record<string, unknown>
): RiderCafeBusinessInfo {
  const phone = String(body.phone ?? "").trim();
  const closedDays = String(body.closedDays ?? "").trim();
  const directions = String(body.directions ?? "").trim();
  const website = String(body.website ?? "").trim();
  const weeklyHours = parseWeeklyOpenHoursFromBody(body);

  return {
    phone: phone || undefined,
    weeklyHours,
    closedDays: closedDays || undefined,
    directions: directions || undefined,
    website: website || undefined,
  };
}

export function hasBusinessInfo(entry: RiderCafeEntry): boolean {
  return Boolean(
    entry.phone ||
      entry.weeklyHours ||
      entry.closedDays ||
      entry.directions ||
      entry.website
  );
}

function buildWeeklyHours(
  days: Partial<
    Record<
      "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
      { closed?: boolean; open: string; close: string }
    >
  >
): WeeklyOpenHours {
  const base = emptyWeeklyOpenHours();
  for (const [day, value] of Object.entries(days)) {
    if (!value) continue;
    base[day as keyof typeof base] = {
      closed: Boolean(value.closed),
      open: value.open,
      close: value.close,
    };
  }
  return base;
}

export const seedRiderCafes: RiderCafeEntry[] = [
  {
    id: "seed-cafe-1",
    name: "바람카페 남해",
    author: "해안라이더",
    address: "경남 남해군 설리면 설리로 123",
    region: "경남",
    imageUrl:
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
    description: "바이크 주차 공간이 넓고 해안 뷰가 좋은 바이크 카페.",
    amenities: ["바이크 주차", "테라스", "음료·디저트"],
    phone: "055-860-1234",
    weeklyHours: buildWeeklyHours({
      mon: { closed: true, open: "09:00", close: "19:00" },
      tue: { open: "09:00", close: "19:00" },
      wed: { open: "09:00", close: "19:00" },
      thu: { open: "09:00", close: "19:00" },
      fri: { open: "09:00", close: "20:00" },
      sat: { open: "09:00", close: "20:00" },
      sun: { open: "09:00", close: "19:00" },
    }),
    closedDays: "설·추석 당일 휴무",
    directions:
      "남해고속도로 남해 IC → 설리 방면 3km. 카페 앞 바이크 전용 주차 10대 가능.",
    website: "https://example.com/namhae-wind",
    likes: 18,
    views: 94,
    createdAt: "2026-07-05T10:00:00.000Z",
  },
  {
    id: "seed-cafe-2",
    name: "속초 바이크 카페",
    author: "강원러너",
    address: "강원 속초시 중앙로 45",
    region: "강원",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
    description: "출발 전 커피 한 잔과 라이더 모임 공간.",
    amenities: ["바이크 주차", "Wi-Fi", "모임 공간"],
    phone: "033-632-5678",
    weeklyHours: buildWeeklyHours({
      mon: { open: "08:00", close: "20:00" },
      tue: { open: "08:00", close: "20:00" },
      wed: { open: "08:00", close: "20:00" },
      thu: { open: "08:00", close: "20:00" },
      fri: { open: "08:00", close: "21:00" },
      sat: { open: "08:00", close: "21:00" },
      sun: { open: "08:00", close: "20:00" },
    }),
    closedDays: "연중무휴 (명절 당일 단축 영업)",
    directions: "속초 IC → 중앙로 직진 1.2km. 건물 뒤편 바이크 주차장 이용.",
    likes: 12,
    views: 67,
    createdAt: "2026-07-04T08:30:00.000Z",
  },
  {
    id: "seed-cafe-3",
    name: "애월 바이크 카페",
    author: "제주라이더",
    address: "제주 제주시 애월읍 애월해안로 12",
    region: "제주",
    imageUrl:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
    description: "1132 해안도로 중간 휴식에 인기 있는 카페.",
    amenities: ["바이크 주차", "오션뷰", "충전 콘센트"],
    phone: "064-123-4567",
    weeklyHours: buildWeeklyHours({
      mon: { open: "10:00", close: "18:00" },
      tue: { open: "10:00", close: "18:00" },
      wed: { open: "10:00", close: "18:00" },
      thu: { open: "10:00", close: "18:00" },
      fri: { open: "10:00", close: "19:00" },
      sat: { open: "10:00", close: "19:00" },
      sun: { open: "10:00", close: "18:00" },
    }),
    closedDays: "폭우·태풍 시 임시 휴무",
    directions:
      "1132번 해안도로 애월읍 구간. 한담해안산책로 입구에서 서쪽 200m.",
    likes: 24,
    views: 112,
    createdAt: "2026-07-03T14:20:00.000Z",
  },
  {
    id: "seed-cafe-4",
    name: "팔당 라이더 스톱",
    author: "팔당크루",
    address: "경기 남양주시 팔당면 팔당로 88",
    region: "수도권",
    imageUrl:
      "https://images.unsplash.com/photo-1453614512568-c7021287638a?auto=format&fit=crop&w=1200&q=80",
    description: "팔당댐 일주 코스의 대표 휴식 거점.",
    amenities: ["바이크 주차", "간식", "화장실"],
    phone: "031-555-7890",
    weeklyHours: buildWeeklyHours({
      mon: { open: "07:00", close: "21:00" },
      tue: { closed: true, open: "07:00", close: "21:00" },
      wed: { open: "07:00", close: "21:00" },
      thu: { open: "07:00", close: "21:00" },
      fri: { open: "07:00", close: "22:00" },
      sat: { open: "07:00", close: "22:00" },
      sun: { open: "07:00", close: "21:00" },
    }),
    closedDays: "설·추석 당일",
    directions:
      "팔당댐 일주로 북쪽 루프 중간 구간. 팔당역 방면에서 댐 방향 2km, 좌측 갈색 간판.",
    likes: 31,
    views: 145,
    createdAt: "2026-07-02T09:00:00.000Z",
  },
];

export function filterRiderCafes(options: {
  entries: RiderCafeEntry[];
  region?: (typeof riderCafeCategories)[number];
  query?: string;
  sort?: "latest" | "popular";
}): RiderCafeEntry[] {
  const { entries, region = "전체", query = "", sort = "latest" } = options;

  const filtered = entries.filter((entry) => {
    if (!matchesDetailRegion(entry.region, region)) return false;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const searchable = [
        entry.name,
        entry.author,
        entry.address,
        entry.description ?? "",
        entry.region,
        entry.phone ?? "",
        formatWeeklyOpenHoursSummary(entry.weeklyHours) ?? "",
        formatTodayOpenHours(entry.weeklyHours) ?? "",
        entry.closedDays ?? "",
        entry.directions ?? "",
        entry.website ?? "",
        ...(entry.amenities ?? []),
      ]
        .join(" ")
        .toLowerCase();

      if (!searchable.includes(q)) return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    if (sort === "popular") {
      return b.likes + b.views - (a.likes + a.views);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function normalizeRiderCafeEntry(
  entry: LegacyRiderCafeEntry
): RiderCafeEntry {
  let weeklyHours =
    normalizeWeeklyOpenHours(entry.weeklyHours) ??
    migrateLegacyOpenHours(entry.openHours, entry.closedDays);

  const normalized: RiderCafeEntry = {
    ...entry,
    region: migrateRiderCafeRegion(String(entry.region), entry.address),
    weeklyHours,
    views: entry.views ?? 0,
    likes: entry.likes ?? 0,
    amenities: entry.amenities ?? [],
  };

  delete (normalized as LegacyRiderCafeEntry).openHours;
  return normalized;
}

export function formatRiderCafeDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function canManageRiderCafe(
  user:
    | {
        id: string;
        nickname: string;
        isAdmin?: boolean;
        isOperator?: boolean;
      }
    | null
    | undefined,
  entry: RiderCafeEntry
): boolean {
  if (!user) return false;
  if (user.isAdmin || user.isOperator) return true;
  if (entry.authorId) return entry.authorId === user.id;
  return entry.author === user.nickname;
}

export function mapPlaceRegionToCafeRegion(
  region: string,
  address = ""
): RiderCafeRegion | null {
  const fromAddress = address ? inferCafeRegionFromAddress(address) : null;
  if (fromAddress) return fromAddress;

  return normalizeDetailRegion(region);
}
