import type { BoardPost } from "@/lib/board";
import type { HotSortKey } from "@/lib/home-portal";

export type HomeHotCard = {
  id: string;
  title: string;
  category: string;
  href: string;
  thumb?: string;
  views: number;
  likes: number;
  commentCount: number;
  createdAt: string;
};

/** Content Spec: (likes×3) + (comments×4) + (views×0.2) */
export function getHotEngagementScore(post: BoardPost): number {
  return (post.likes ?? 0) * 3 + post.comments.length * 4 + (post.views ?? 0) * 0.2;
}

function hoursAgoMs(hours: number): number {
  return Date.now() - hours * 60 * 60 * 1000;
}

function postsSince(posts: BoardPost[], sinceMs: number): BoardPost[] {
  return posts.filter((p) => {
    const t = new Date(p.createdAt).getTime();
    return !Number.isNaN(t) && t >= sinceMs;
  });
}

/**
 * Content Spec window: prefer last 24h; if fewer than 3 posts, expand to 48h.
 * Sparse fallback: 7 days, then all posts (so empty communities still surface content).
 */
export function pickHotCandidatePosts(posts: BoardPost[]): BoardPost[] {
  const h24 = postsSince(posts, hoursAgoMs(24));
  if (h24.length >= 3) return h24;

  const h48 = postsSince(posts, hoursAgoMs(48));
  if (h48.length >= 3) return h48;
  if (h48.length > 0) return h48;

  const week = postsSince(posts, hoursAgoMs(24 * 7));
  if (week.length > 0) return week;
  return posts;
}

export function toHotCard(post: BoardPost): HomeHotCard {
  return {
    id: post.id,
    title: post.title,
    category: post.category,
    href: `/board/${post.id}`,
    thumb: post.imageUrls[0],
    views: post.views ?? 0,
    likes: post.likes ?? 0,
    commentCount: post.comments.length,
    createdAt: post.createdAt,
  };
}

function sortByKey(posts: BoardPost[], key: HotSortKey): BoardPost[] {
  return [...posts].sort((a, b) => {
    if (key === "views") return (b.views ?? 0) - (a.views ?? 0);
    if (key === "likes") return (b.likes ?? 0) - (a.likes ?? 0);
    return b.comments.length - a.comments.length;
  });
}

/** Primary home Hot list (Content Spec / Sprint 1). */
export function buildTodayHotCards(
  posts: BoardPost[],
  limit = 6
): HomeHotCard[] {
  const pool = pickHotCandidatePosts(posts);
  return [...pool]
    .sort((a, b) => {
      const scoreDiff = getHotEngagementScore(b) - getHotEngagementScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, limit)
    .map(toHotCard);
}

/** @deprecated Tabs removed from home UI; kept for compatibility. */
export function buildHotLists(
  posts: BoardPost[],
  limit = 8
): Record<HotSortKey, HomeHotCard[]> {
  const pool = pickHotCandidatePosts(posts);
  return {
    views: sortByKey(pool, "views").slice(0, limit).map(toHotCard),
    likes: sortByKey(pool, "likes").slice(0, limit).map(toHotCard),
    comments: sortByKey(pool, "comments").slice(0, limit).map(toHotCard),
  };
}
