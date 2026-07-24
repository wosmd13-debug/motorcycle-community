/**
 * Home portal discovery config.
 * Swap href / comingSoon when news or brand pages ship — no DB changes needed.
 */

export type BikeBrandLink = {
  id: string;
  label: string;
  /** Board search query (used when href is omitted) */
  query: string;
  /** Override destination; defaults to `/board?q={query}` */
  href?: string;
  comingSoon?: boolean;
};

export type DiscoverMenuItem = {
  id: string;
  label: string;
  description: string;
  href?: string;
  comingSoon?: boolean;
};

export const HOME_HERO = {
  brand: "Byanra",
  tagline: "라이더가 모이는 바이크 커뮤니티",
  subcopy:
    "코스·정비·장비부터 라이딩 모집까지. 오늘도 함께 달릴 이야기를 나눠보세요.",
} as const;

export const BIKE_BRANDS: BikeBrandLink[] = [
  { id: "honda", label: "Honda", query: "Honda" },
  { id: "yamaha", label: "Yamaha", query: "Yamaha" },
  { id: "kawasaki", label: "Kawasaki", query: "Kawasaki" },
  { id: "bmw", label: "BMW", query: "BMW" },
  { id: "ducati", label: "Ducati", query: "Ducati" },
  { id: "suzuki", label: "Suzuki", query: "Suzuki" },
  { id: "ktm", label: "KTM", query: "KTM" },
];

export const DISCOVER_MENU: DiscoverMenuItem[] = [
  {
    id: "meetups",
    label: "라이딩 모집",
    description: "일정 확인·참가",
    href: "/meetups",
  },
  {
    id: "news",
    label: "바이크 뉴스",
    description: "신차·이슈 소식",
    comingSoon: true,
  },
  {
    id: "questions",
    label: "질문 게시판",
    description: "초보·정비 Q&A",
    href: "/board?q=질문",
  },
  {
    id: "board",
    label: "자유게시판",
    description: "자유·코스·장비",
    href: "/board",
  },
];

export function getBikeBrandHref(brand: BikeBrandLink): string {
  if (brand.href) return brand.href;
  return `/board?q=${encodeURIComponent(brand.query)}`;
}

export type HotSortKey = "views" | "likes" | "comments";

export const HOT_SORT_TABS: { key: HotSortKey; label: string }[] = [
  { key: "views", label: "조회수" },
  { key: "likes", label: "좋아요" },
  { key: "comments", label: "댓글" },
];
