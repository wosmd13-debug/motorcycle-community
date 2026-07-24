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

function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toDateKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return localDateKey(d);
}

function todayKey(): string {
  return localDateKey(new Date());
}

function daysAgoKey(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

function toHotCard(post: BoardPost): HomeHotCard {
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

/** Prefer today's posts; fall back to last 7 days when sparse. */
export function pickHotCandidatePosts(posts: BoardPost[]): BoardPost[] {
  const today = todayKey();
  const todays = posts.filter((p) => toDateKey(p.createdAt) === today);
  if (todays.length >= 3) return todays;

  const since = daysAgoKey(7).getTime();
  const week = posts.filter((p) => {
    const t = new Date(p.createdAt).getTime();
    return !Number.isNaN(t) && t >= since;
  });

  if (week.length > 0) return week;
  return posts;
}

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
