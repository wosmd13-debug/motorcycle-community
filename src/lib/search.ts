export const searchSources = [
  "board",
  "promo",
  "marketplace",
  "gallery",
  "video",
  "cafe",
  "route",
] as const;

export type SearchSource = (typeof searchSources)[number];

export type SearchResultItem = {
  id: string;
  source: SearchSource;
  sourceLabel: string;
  title: string;
  subtitle: string;
  excerpt: string;
  href: string;
  date?: string;
  meta?: string;
};

export type SearchResultGroup = {
  source: SearchSource;
  label: string;
  items: SearchResultItem[];
  total: number;
  moreHref: string;
};

export type SearchResults = {
  query: string;
  groups: SearchResultGroup[];
  totalCount: number;
};

export const searchSourceLabels: Record<SearchSource, string> = {
  board: "자유게시판",
  promo: "자유홍보",
  marketplace: "중고거래",
  gallery: "갤러리",
  video: "영상",
  cafe: "바이크 카페",
  route: "바리 코스",
};

export function buildSectionHref(
  source: SearchSource,
  query: string,
  id?: string
): string {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());

  if (id) {
    const directPaths: Partial<Record<SearchSource, string>> = {
      board: `/board/${id}`,
      promo: `/promo/${id}`,
      gallery: `/gallery/${id}`,
      marketplace: `/marketplace/${id}`,
      video: `/videos/${id}`,
      cafe: `/cafes/${id}`,
    };
    const direct = directPaths[source];
    if (direct) {
      const queryString = params.toString();
      return queryString ? `${direct}?${queryString}` : direct;
    }
    params.set("id", id);
  }

  const queryString = params.toString();
  const base = {
    board: "/board",
    promo: "/promo",
    marketplace: "/marketplace",
    gallery: "/gallery",
    video: "/videos",
    cafe: "/cafes",
    route: "/routes",
  }[source];

  return queryString ? `${base}?${queryString}` : base;
}

export function truncateText(text: string, maxLength = 100): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}…`;
}
