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
