/** 게시판·코스·카페 등에서 공통으로 쓰는 세부 지역 */
export const detailRegions = [
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

export type DetailRegion = (typeof detailRegions)[number];

export const filterRegions = ["전체", ...detailRegions] as const;

export type FilterRegion = (typeof filterRegions)[number];

const LEGACY_REGION_MAP: Record<string, DetailRegion> = {
  "서울·경기": "수도권",
  충청: "충남",
  전라: "전남",
  경상: "경남",
};

export function isDetailRegion(value: string): value is DetailRegion {
  return detailRegions.includes(value as DetailRegion);
}

export function normalizeDetailRegion(region: string): DetailRegion | null {
  if (isDetailRegion(region)) return region;
  return LEGACY_REGION_MAP[region] ?? null;
}

export function matchesDetailRegion(
  itemRegion: string,
  filter: string
): boolean {
  if (filter === "전체") return true;
  if (itemRegion === filter) return true;

  const normalizedItem = normalizeDetailRegion(itemRegion);
  const normalizedFilter = normalizeDetailRegion(filter);

  if (normalizedItem && normalizedFilter) {
    return normalizedItem === normalizedFilter;
  }

  return false;
}
