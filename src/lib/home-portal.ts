/**
 * Home portal discovery config.
 * Swap href / comingSoon when news or brand pages ship — no DB changes needed.
 */

import { SITE_NAME } from "@/lib/seo";

export type BikeBrandLink = {
  id: string;
  label: string;
  /** Board search query (used when href is omitted) */
  query: string;
  /** Override destination; defaults to `/board?brand={id}` */
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
  brand: SITE_NAME,
  tagline: "라이더가 모이는 바이크 커뮤니티",
  subcopy:
    "오늘 뜨는 이야기부터 라이딩 모집까지. 바이크를 좋아하는 사람들이 모이는 곳입니다.",
} as const;

export const BIKE_BRANDS: BikeBrandLink[] = [
  { id: "honda", label: "Honda", query: "Honda" },
  { id: "yamaha", label: "Yamaha", query: "Yamaha" },
  { id: "kawasaki", label: "Kawasaki", query: "Kawasaki" },
  { id: "bmw", label: "BMW", query: "BMW" },
  { id: "ducati", label: "Ducati", query: "Ducati" },
  { id: "suzuki", label: "Suzuki", query: "Suzuki" },
  { id: "ktm", label: "KTM", query: "KTM" },
  { id: "harley-davidson", label: "Harley-Davidson", query: "Harley" },
  { id: "indian", label: "Indian", query: "Indian" },
  { id: "royal-enfield", label: "Royal Enfield", query: "Royal Enfield" },
  { id: "triumph", label: "Triumph", query: "Triumph" },
  { id: "aprilia", label: "Aprilia", query: "Aprilia" },
  { id: "vespa", label: "Vespa", query: "Vespa" },
  { id: "benelli", label: "Benelli", query: "Benelli" },
];

export function getBikeBrandById(id: string): BikeBrandLink | undefined {
  return BIKE_BRANDS.find((brand) => brand.id === id);
}

export function isBikeBrandId(value: string): boolean {
  return BIKE_BRANDS.some((brand) => brand.id === value);
}

export function getBikeBrandHref(brand: BikeBrandLink): string {
  if (brand.href) return brand.href;
  return `/board?brand=${encodeURIComponent(brand.id)}`;
}

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

export type HotSortKey = "views" | "likes" | "comments";

export const HOT_SORT_TABS: { key: HotSortKey; label: string }[] = [
  { key: "views", label: "조회수" },
  { key: "likes", label: "좋아요" },
  { key: "comments", label: "댓글" },
];
