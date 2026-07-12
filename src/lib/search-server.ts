import { filterBoardPosts, formatBoardDate } from "@/lib/board";
import { readBoardPosts } from "@/lib/board-store";
import { filterGalleryPosts, formatGalleryDate } from "@/lib/gallery";
import { readGalleryPosts } from "@/lib/gallery-store";
import {
  filterMarketplaceItems,
  formatMarketplaceDate,
  formatMarketplacePrice,
} from "@/lib/marketplace";
import { readMarketplaceItems } from "@/lib/marketplace-store";
import { filterPromoPosts, formatPromoDate } from "@/lib/promo";
import { readPromoPosts } from "@/lib/promo-store";
import { filterRiderCafes } from "@/lib/rider-cafe";
import { readRiderCafes } from "@/lib/rider-cafe-store";
import { readBariRoutes } from "@/lib/bari-route-store";
import { filterRoutes } from "@/lib/routes-data";
import { filterMemberRoutes, formatMemberRouteDistance, formatMemberRouteDuration } from "@/lib/member-route";
import { readMemberRoutes } from "@/lib/member-route-store";
import {
  buildSectionHref,
  searchSourceLabels,
  truncateText,
  type SearchResultGroup,
  type SearchResultItem,
  type SearchResults,
  type SearchSource,
} from "@/lib/search";
import { filterVideos, formatVideoDate } from "@/lib/videos";
import { readVideos } from "@/lib/video-store";

const DEFAULT_LIMIT = 5;

function toGroup(
  source: SearchSource,
  query: string,
  items: SearchResultItem[],
  total: number
): SearchResultGroup | null {
  if (total === 0) return null;

  return {
    source,
    label: searchSourceLabels[source],
    items,
    total,
    moreHref: buildSectionHref(source, query),
  };
}

export async function searchSite(
  query: string,
  limitPerSection = DEFAULT_LIMIT
): Promise<SearchResults> {
  const trimmed = query.trim();

  if (!trimmed) {
    return { query: "", groups: [], totalCount: 0 };
  }

  const [boardPosts, promoPosts, marketplaceItems, galleryPosts, videos, cafes, memberRoutes, bariRoutes] =
    await Promise.all([
      readBoardPosts(),
      readPromoPosts(),
      readMarketplaceItems(),
      readGalleryPosts(),
      readVideos(),
      readRiderCafes(),
      readMemberRoutes(),
      readBariRoutes(),
    ]);

  const boardMatches = filterBoardPosts({ posts: boardPosts, query: trimmed });
  const promoMatches = filterPromoPosts({ posts: promoPosts, query: trimmed });
  const marketplaceMatches = filterMarketplaceItems({
    items: marketplaceItems,
    query: trimmed,
  });
  const galleryMatches = filterGalleryPosts({
    posts: galleryPosts,
    query: trimmed,
  });
  const videoMatches = filterVideos({ videos, query: trimmed });
  const cafeMatches = filterRiderCafes({ entries: cafes, query: trimmed });
  const routeMatches = filterRoutes(bariRoutes, { query: trimmed });
  const memberRouteMatches = filterMemberRoutes({
    routes: memberRoutes,
    query: trimmed,
  });
  const combinedRouteItems = [
    ...routeMatches.map((route) => ({
      id: String(route.id),
      title: route.name,
      subtitle: `${route.region} · ${route.type} · ${route.difficulty} · 추천`,
      excerpt: truncateText(route.description),
      href: buildSectionHref("route", trimmed, String(route.id)),
      meta: `${route.distance} · ${route.duration}`,
    })),
    ...memberRouteMatches.map((route) => ({
      id: route.id,
      title: route.name,
      subtitle: `${route.region} · ${route.type} · ${route.difficulty} · ${route.author}`,
      excerpt: truncateText(route.description || route.author),
      href: buildSectionHref("route", trimmed, route.id),
      meta: `${formatMemberRouteDistance(route.distanceKm)} · ${formatMemberRouteDuration(route.durationMin)}`,
    })),
  ];
  const combinedRouteTotal = routeMatches.length + memberRouteMatches.length;

  const groups = [
    toGroup(
      "board",
      trimmed,
      boardMatches.slice(0, limitPerSection).map((post) => ({
        id: post.id,
        source: "board" as const,
        sourceLabel: searchSourceLabels.board,
        title: post.title,
        subtitle: `${post.category} · ${post.author}`,
        excerpt: truncateText(post.content),
        href: buildSectionHref("board", trimmed, post.id),
        date: formatBoardDate(post.createdAt),
        meta: `추천 ${post.likes} · 조회 ${post.views}`,
      })),
      boardMatches.length
    ),
    toGroup(
      "promo",
      trimmed,
      promoMatches.slice(0, limitPerSection).map((post) => ({
        id: post.id,
        source: "promo" as const,
        sourceLabel: searchSourceLabels.promo,
        title: post.title,
        subtitle: `${post.category} · ${post.author}`,
        excerpt: truncateText(post.content),
        href: buildSectionHref("promo", trimmed, post.id),
        date: formatPromoDate(post.createdAt),
        meta: `추천 ${post.likes} · 조회 ${post.views}`,
      })),
      promoMatches.length
    ),
    toGroup(
      "marketplace",
      trimmed,
      marketplaceMatches.slice(0, limitPerSection).map((item) => ({
        id: item.id,
        source: "marketplace" as const,
        sourceLabel: searchSourceLabels.marketplace,
        title: item.title,
        subtitle: `${item.category} · ${item.seller}`,
        excerpt: truncateText(item.description),
        href: buildSectionHref("marketplace", trimmed, item.id),
        date: formatMarketplaceDate(item.createdAt),
        meta: `${formatMarketplacePrice(item.price)} · ${item.location}`,
      })),
      marketplaceMatches.length
    ),
    toGroup(
      "gallery",
      trimmed,
      galleryMatches.slice(0, limitPerSection).map((post) => ({
        id: post.id,
        source: "gallery" as const,
        sourceLabel: searchSourceLabels.gallery,
        title: post.title,
        subtitle: `${post.category} · ${post.author}`,
        excerpt: truncateText(post.caption || post.location),
        href: buildSectionHref("gallery", trimmed, post.id),
        date: formatGalleryDate(post.createdAt),
        meta: post.location,
      })),
      galleryMatches.length
    ),
    toGroup(
      "video",
      trimmed,
      videoMatches.slice(0, limitPerSection).map((video) => ({
        id: video.id,
        source: "video" as const,
        sourceLabel: searchSourceLabels.video,
        title: video.title,
        subtitle: `${video.category} · ${video.channelName}`,
        excerpt: truncateText(video.description || video.submitter),
        href: buildSectionHref("video", trimmed, video.id),
        date: formatVideoDate(video.createdAt),
        meta: `추천 ${video.likes} · 조회 ${video.views}`,
      })),
      videoMatches.length
    ),
    toGroup(
      "cafe",
      trimmed,
      cafeMatches.slice(0, limitPerSection).map((entry) => ({
        id: entry.id,
        source: "cafe" as const,
        sourceLabel: searchSourceLabels.cafe,
        title: entry.name,
        subtitle: `${entry.region} · ${entry.author}`,
        excerpt: truncateText(entry.description || entry.address),
        href: buildSectionHref("cafe", trimmed, entry.id),
        date: new Date(entry.createdAt).toLocaleDateString("ko-KR"),
        meta: entry.address,
      })),
      cafeMatches.length
    ),
    toGroup(
      "route",
      trimmed,
      combinedRouteItems.slice(0, limitPerSection).map((route) => ({
        id: route.id,
        source: "route" as const,
        sourceLabel: searchSourceLabels.route,
        title: route.title,
        subtitle: route.subtitle,
        excerpt: route.excerpt,
        href: route.href,
        meta: route.meta,
      })),
      combinedRouteTotal
    ),
  ].filter((group): group is SearchResultGroup => group !== null);

  const totalCount = groups.reduce((sum, group) => sum + group.total, 0);

  return {
    query: trimmed,
    groups,
    totalCount,
  };
}

export async function getPopularSearchHints(): Promise<string[]> {
  const hints = new Set<string>();
  const bariRoutes = await readBariRoutes();

  for (const route of bariRoutes.slice(0, 3)) {
    hints.add(route.region);
  }

  hints.add("정비");
  hints.add("투어");
  hints.add("카페");

  return Array.from(hints);
}
