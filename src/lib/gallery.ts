export const galleryCategories = [
  "전체",
  "라이딩",
  "바이크",
  "풍경",
  "크루",
  "인증",
] as const;

export type GalleryCategory = Exclude<
  (typeof galleryCategories)[number],
  "전체"
>;

export type GalleryComment = {
  id: string;
  author: string;
  content: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
};

export type CommentVoteChoice = "up" | "down";

export type GalleryPost = {
  id: string;
  title: string;
  author: string;
  location: string;
  category: GalleryCategory;
  imageUrl: string;
  caption?: string;
  likes: number;
  views: number;
  comments: GalleryComment[];
  createdAt: string;
};

export type CreateGalleryPostInput = {
  title: string;
  author: string;
  location: string;
  category: GalleryCategory;
  imageUrl: string;
  caption?: string;
};

export const seedGalleryPosts: GalleryPost[] = [
  {
    id: "seed-1",
    title: "속초 해변 일출 라이딩",
    author: "새벽라이더",
    location: "강원 속초",
    category: "라이딩",
    imageUrl:
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=1200&q=80",
    caption: "일출 직후 해안도로를 달리며 찍은 인증샷입니다.",
    likes: 42,
    views: 128,
    comments: [
      {
        id: "c-seed-1",
        author: "해안라이더",
        content: "일출 타이밍 완벽하네요! 몇 시에 출발하셨어요?",
        upvotes: 3,
        downvotes: 0,
        createdAt: "2026-07-04T08:10:00.000Z",
      },
    ],
    createdAt: "2026-07-04T05:30:00.000Z",
  },
  {
    id: "seed-2",
    title: "지리산 능선 코스 인증샷",
    author: "산악크루",
    location: "전남 구례",
    category: "인증",
    imageUrl:
      "https://images.unsplash.com/photo-1464207688109-390f021e1304?auto=format&fit=crop&w=1200&q=80",
    caption: "구례에서 출발해 능선 뷰 포인트에서 휴식.",
    likes: 38,
    views: 96,
    comments: [],
    createdAt: "2026-07-03T09:15:00.000Z",
  },
  {
    id: "seed-3",
    title: "제주 해안도로 투어",
    author: "제주라이더",
    location: "제주 서귀포",
    category: "풍경",
    imageUrl:
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40c?auto=format&fit=crop&w=1200&q=80",
    caption: "1132번 해안도로의 에메랄드빛 바다.",
    likes: 55,
    views: 210,
    comments: [],
    createdAt: "2026-07-02T14:00:00.000Z",
  },
  {
    id: "seed-4",
    title: "가을 단풍 라이딩",
    author: "단풍매니아",
    location: "충북 제천",
    category: "풍경",
    imageUrl:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
    caption: "제천 의림지 인근 단풍 구간.",
    likes: 29,
    views: 74,
    comments: [],
    createdAt: "2026-07-01T11:20:00.000Z",
  },
  {
    id: "seed-5",
    title: "첫 바이크 데뷔 기념",
    author: "신입라이더",
    location: "경기 용인",
    category: "바이크",
    imageUrl:
      "https://images.unsplash.com/photo-1558981404-c648eb53f013?auto=format&fit=crop&w=1200&q=80",
    caption: "첫 바이크와 함께한 기념 촬영.",
    likes: 61,
    views: 185,
    comments: [],
    createdAt: "2026-06-30T16:45:00.000Z",
  },
  {
    id: "seed-6",
    title: "크루 단체 라이딩",
    author: "서울크루",
    location: "서울 한강",
    category: "크루",
    imageUrl:
      "https://images.unsplash.com/photo-1527482795227-404130088fed?auto=format&fit=crop&w=1200&q=80",
    caption: "주말 아침 한강 코스 단체 라이딩.",
    likes: 47,
    views: 152,
    comments: [],
    createdAt: "2026-06-29T08:00:00.000Z",
  },
];

export function filterGalleryPosts(options: {
  posts: GalleryPost[];
  category?: (typeof galleryCategories)[number];
  query?: string;
  sort?: "latest" | "popular";
}): GalleryPost[] {
  const { posts, category = "전체", query = "", sort = "latest" } = options;

  const filtered = posts.filter((post) => {
    if (category !== "전체" && post.category !== category) return false;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const searchable = [
        post.title,
        post.author,
        post.location,
        post.caption ?? "",
        post.category,
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

export function normalizeGalleryComment(comment: GalleryComment): GalleryComment {
  return {
    ...comment,
    upvotes: comment.upvotes ?? 0,
    downvotes: comment.downvotes ?? 0,
  };
}

export function normalizeGalleryPost(post: GalleryPost): GalleryPost {
  return {
    ...post,
    views: post.views ?? 0,
    comments: (post.comments ?? []).map(normalizeGalleryComment),
  };
}

export function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatGalleryDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
