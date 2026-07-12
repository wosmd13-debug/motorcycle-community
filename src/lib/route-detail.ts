import {
  getPlacesForRoute,
  getRouteLinkNote,
  placeCategoryLabels,
  type PlaceCategory,
  type RiderPlace,
} from "@/lib/places-data";
import type { RouteDifficulty } from "@/lib/routes-data";

export const difficultyMeta: Record<
  RouteDifficulty,
  {
    label: string;
    summary: string;
    description: string;
    skill: string;
    badgeClass: string;
  }
> = {
  초급: {
    label: "초급",
    summary: "입문·첫 바리에 적합",
    description:
      "완만한 커브와 비교적 짧은 거리 위주. 라이딩 경험이 적어도 부담 없이 다녀올 수 있는 코스입니다.",
    skill: "500km 미만 경험 · 기본 코너링 가능",
    badgeClass: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  중급: {
    label: "중급",
    summary: "주말 투어·장거리에 적합",
    description:
      "해안·산악 구간이 섞이거나 거리가 긴 편입니다. 중간 휴식 계획과 기본 정비 점검이 필요합니다.",
    skill: "1,000km+ 경험 · 장거리 주행 가능",
    badgeClass: "bg-sky-100 text-sky-800 ring-sky-200",
  },
  상급: {
    label: "상급",
    summary: "숙련 라이더·종일 라이딩",
    description:
      "긴 거리, 고랭지·험로, 변수가 많은 구간이 포함될 수 있습니다. 체력·장비·날씨 대비가 중요합니다.",
    skill: "장거리·산악 경험 · 긴급 상황 대응 가능",
    badgeClass: "bg-orange-100 text-orange-800 ring-orange-200",
  },
};

const restStopCategories = new Set<PlaceCategory>([
  "cafe",
  "fuel",
  "parking",
  "restaurant",
  "viewpoint",
]);

export type RouteRestStop = RiderPlace & {
  routeNote?: string;
  sortOrder: number;
};

export function getRestStopsForRoute(routeId: number): RouteRestStop[] {
  return getPlacesForRoute(routeId)
    .filter((place) => restStopCategories.has(place.category))
    .map((place) => {
      const link = place.routeLinks.find((item) => item.routeId === routeId);
      return {
        ...place,
        routeNote: getRouteLinkNote(place, routeId),
        sortOrder: link?.sortOrder ?? 999,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function summarizeRestStops(stops: RouteRestStop[]): string {
  if (stops.length === 0) return "등록된 휴식 스팟 없음";

  const counts = stops.reduce<Record<string, number>>((acc, stop) => {
    const label = placeCategoryLabels[stop.category];
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([label, count]) => `${label} ${count}`)
    .join(" · ");
}

export function estimateRestBreakCount(distanceKm: number): number {
  if (distanceKm <= 80) return 1;
  if (distanceKm <= 160) return 2;
  if (distanceKm <= 260) return 3;
  return 4;
}
