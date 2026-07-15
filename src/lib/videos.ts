export const videoCategories = [
  "전체",
  "브이로그",
  "바이크 리뷰",
  "정비·튜닝",
  "투어·여행",
  "크루·이벤트",
  "채널 홍보",
] as const;

export type VideoCategory = Exclude<
  (typeof videoCategories)[number],
  "전체"
>;

export type CommentVoteChoice = "up" | "down";

export type VideoComment = {
  id: string;
  author: string;
  content: string;
  upvotes: number;
  downvotes: number;
  /** 서버 전용 — API 응답에서는 제거 */
  votesBy?: Record<string, CommentVoteChoice>;
  createdAt: string;
};

export type VideoPost = {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  channelName: string;
  submitter: string;
  authorId?: string;
  description: string;
  category: VideoCategory;
  tags: string[];
  likes: number;
  /** 서버 전용 — API 응답에서는 제거 */
  likedBy?: string[];
  views: number;
  comments: VideoComment[];
  createdAt: string;
};

export type CreateVideoPostInput = {
  title: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  channelName: string;
  submitter: string;
  authorId: string;
  description: string;
  category: VideoCategory;
  tags: string[];
};

export function parseYouTubeVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2] ?? null;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] ?? null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function parseTagsInput(raw: string): string[] {
  return raw
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export const seedVideos: VideoPost[] = [
  {
    id: "video-seed-1",
    title: "주말 팔당댐 라이딩 브이로그",
    youtubeUrl: "https://www.youtube.com/watch?v=ZhGhugh1F4s",
    youtubeVideoId: "ZhGhugh1F4s",
    channelName: "라이더로그",
    submitter: "팔당러",
    description:
      "서울에서 팔당댐까지 왕복 라이딩 코스와 휴식 포인트를 소개합니다. 초보 라이더도 따라 하기 좋아요.",
    category: "브이로그",
    tags: ["팔당", "주말라이딩", "브이로그"],
    likes: 34,
    views: 892,
    comments: [
      {
        id: "vc-seed-1",
        author: "주말라이더",
        content: "출발 시간대 정보까지 있으면 더 좋겠어요!",
        upvotes: 2,
        downvotes: 0,
        createdAt: "2026-07-04T10:00:00.000Z",
      },
    ],
    createdAt: "2026-07-04T08:00:00.000Z",
  },
  {
    id: "video-seed-2",
    title: "2024 스포츠바이크 600cc 비교 리뷰",
    youtubeUrl: "https://www.youtube.com/watch?v=ZhGhugh1F4s",
    youtubeVideoId: "ZhGhugh1F4s",
    channelName: "바이크리뷰TV",
    submitter: "600cc매니아",
    description: "600cc급 스포츠바이크 3종의 장단점과 추천 대상을 정리했습니다.",
    category: "바이크 리뷰",
    tags: ["600cc", "스포츠바이크", "리뷰"],
    likes: 56,
    views: 1240,
    comments: [],
    createdAt: "2026-07-03T12:30:00.000Z",
  },
  {
    id: "video-seed-3",
    title: "체인 청소·윤활 초보자 가이드",
    youtubeUrl: "https://www.youtube.com/watch?v=ZhGhugh1F4s",
    youtubeVideoId: "ZhGhugh1F4s",
    channelName: "정비하는 라이더",
    submitter: "셀프정비",
    description: "집에서 할 수 있는 체인 관리 방법과 필요한 도구를 소개합니다.",
    category: "정비·튜닝",
    tags: ["체인", "정비", "초보"],
    likes: 41,
    views: 670,
    comments: [],
    createdAt: "2026-07-02T09:15:00.000Z",
  },
  {
    id: "video-seed-4",
    title: "남해 해안 일주 2박 3일 투어",
    youtubeUrl: "https://www.youtube.com/watch?v=ZhGhugh1F4s",
    youtubeVideoId: "ZhGhugh1F4s",
    channelName: "투어라이더",
    submitter: "남해크루",
    description: "남해 해안도로 일주 투어 코스, 숙소, 맛집 포인트를 담았습니다.",
    category: "투어·여행",
    tags: ["남해", "일주", "투어"],
    likes: 72,
    views: 2100,
    comments: [],
    createdAt: "2026-07-01T14:00:00.000Z",
  },
];

export function filterVideos(options: {
  videos: VideoPost[];
  category?: (typeof videoCategories)[number];
  query?: string;
  sort?: "latest" | "popular";
}): VideoPost[] {
  const { videos, category = "전체", query = "", sort = "latest" } = options;

  const filtered = videos.filter((video) => {
    if (category !== "전체" && video.category !== category) return false;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const searchable = [
        video.title,
        video.channelName,
        video.submitter,
        video.description,
        video.category,
        ...video.tags,
      ]
        .join(" ")
        .toLowerCase();

      if (!searchable.includes(q)) return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    if (sort === "popular") {
      return b.likes + b.views - (a.likes + a.views);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function normalizeVideoComment(comment: VideoComment): VideoComment {
  return {
    ...comment,
    upvotes: comment.upvotes ?? 0,
    downvotes: comment.downvotes ?? 0,
  };
}

export function normalizeVideoPost(video: VideoPost): VideoPost {
  return {
    ...video,
    tags: video.tags ?? [],
    views: video.views ?? 0,
    comments: (video.comments ?? []).map(normalizeVideoComment),
  };
}

export function formatVideoDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function canManageVideo(
  user:
    | {
        id: string;
        nickname: string;
        isAdmin?: boolean;
        isOperator?: boolean;
      }
    | null
    | undefined,
  video: VideoPost
): boolean {
  if (!user) return false;
  if (user.isAdmin || user.isOperator) return true;
  if (video.authorId) return video.authorId === user.id;
  return video.submitter === user.nickname;
}
