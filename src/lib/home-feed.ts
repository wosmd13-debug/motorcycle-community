import type { BoardPost } from "@/lib/board";
import type { GalleryPost } from "@/lib/gallery";

export type HomeFeedItem = {
  key: string;
  id: string;
  source: "board" | "gallery";
  title: string;
  href: string;
  thumb?: string;
  category: string;
  commentCount: number;
  createdAt: string;
  popularityScore: number;
};

function boardToFeedItem(post: BoardPost): HomeFeedItem {
  return {
    key: `board-${post.id}`,
    id: post.id,
    source: "board",
    title: post.title,
    href: `/board/${post.id}`,
    thumb: post.imageUrls[0],
    category: post.category,
    commentCount: post.comments.length,
    createdAt: post.createdAt,
    popularityScore: post.likes + post.views + post.comments.length * 2,
  };
}

function galleryToFeedItem(post: GalleryPost): HomeFeedItem {
  return {
    key: `gallery-${post.id}`,
    id: post.id,
    source: "gallery",
    title: post.title,
    href: `/gallery/${post.id}`,
    thumb: post.imageUrl,
    category: post.category,
    commentCount: post.comments.length,
    createdAt: post.createdAt,
    popularityScore: post.likes + post.views + post.comments.length * 2,
  };
}

export function buildHomeFeedItems(options: {
  boardPosts: BoardPost[];
  galleryPosts: GalleryPost[];
  sort: "latest" | "popular";
  limit?: number;
}): HomeFeedItem[] {
  const { boardPosts, galleryPosts, sort, limit = 20 } = options;

  const items = [
    ...boardPosts.map(boardToFeedItem),
    ...galleryPosts.map(galleryToFeedItem),
  ];

  items.sort((a, b) => {
    if (sort === "popular") {
      return b.popularityScore - a.popularityScore;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return items.slice(0, limit);
}

/** Sprint 1 Latest Posts: board only, newest first, exclude Today Hot ids. */
export function buildLatestBoardFeedItems(options: {
  boardPosts: BoardPost[];
  excludeIds?: Iterable<string>;
  limit?: number;
}): HomeFeedItem[] {
  const exclude = new Set(options.excludeIds ?? []);
  const limit = options.limit ?? 10;

  return options.boardPosts
    .filter((post) => !exclude.has(post.id))
    .map(boardToFeedItem)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, limit);
}

export function isHomeFeedItemNew(
  createdAt: string,
  withinMs = 60 * 60 * 1000
): boolean {
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= withinMs;
}

/** Relative time for home latest list (Content Spec). */
export function formatHomeRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";

  const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diffSec < 60) return "방금";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;

  return new Date(iso).toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  });
}
