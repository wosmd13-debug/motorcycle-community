export const boardCategories = [
  "전체",
  "자유",
  "코스",
  "정비",
  "장비",
  "모임",
] as const;

export type BoardCategory = Exclude<
  (typeof boardCategories)[number],
  "전체"
>;

export type BoardCategoryMeta = {
  label: BoardCategory;
  emoji: string;
  summary: string;
  description: string;
  examples: string[];
  titlePlaceholder: string;
  contentPlaceholder: string;
  badgeClass: string;
  cardClass: string;
};

export const boardCategoryMeta: Record<BoardCategory, BoardCategoryMeta> = {
  자유: {
    label: "자유",
    emoji: "💬",
    summary: "잡담·질문·일상",
    description:
      "카테고리가 애매하거나 가볍게 나누고 싶은 이야기를 올려요. 초보 질문, 라이딩 소감, 잡담도 환영합니다.",
    examples: [
      "오늘 라이딩 후기",
      "초보 라이더 질문",
      "이번 주말 같이 갈 분?",
    ],
    titlePlaceholder: "예: 첫 장거리 라이딩 후기 공유합니다",
    contentPlaceholder:
      "자유롭게 이야기해 주세요. 같이 갈 사람을 구할 때는 출발지·날짜·페이스를 적어주면 좋아요.",
    badgeClass: "bg-signature-muted text-signature-darker ring-signature/30",
    cardClass: "border-signature/30 bg-signature-light/80 hover:border-signature/40",
  },
  코스: {
    label: "코스",
    emoji: "🛣️",
    summary: "코스·경로 추천",
    description:
      "다녀온 라이딩 코스, 추천 경로, 휴식·주유 포인트 등 길과 관련된 정보를 공유해요.",
    examples: [
      "남해 해안 일주 코스",
      "강원 1박 2일 루트",
      "팔당댐 추천 경로",
    ],
    titlePlaceholder: "예: 남해 일주 추천 코스 (설리→통영)",
    contentPlaceholder:
      "출발·도착, 경유지, 총 거리, 난이도, 휴식·주유 포인트를 적어주세요.",
    badgeClass: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    cardClass: "border-emerald-200 bg-emerald-50/80 hover:border-emerald-300",
  },
  정비: {
    label: "정비",
    emoji: "🔧",
    summary: "점검·수리·관리",
    description:
      "바이크 점검, 수리 방법, 소모품 교환 주기 등 정비·관리 관련 질문과 팁을 나눠요.",
    examples: [
      "체인 청소 주기",
      "오일 교환 방법",
      "타이어 관리 팁",
    ],
    titlePlaceholder: "예: 체인 청소 주기 어떻게 관리하세요?",
    contentPlaceholder:
      "바이크 모델, 증상, 시도해 본 방법, 궁금한 점을 구체적으로 적어주세요.",
    badgeClass: "bg-sky-100 text-sky-800 ring-sky-200",
    cardClass: "border-sky-200 bg-sky-50/80 hover:border-sky-300",
  },
  장비: {
    label: "장비",
    emoji: "🪖",
    summary: "헬멧·의류·용품",
    description:
      "헬멧, 자켓, 장갑, 거치대 등 장비 추천·비교·사용 후기를 올려요.",
    examples: [
      "여름 메쉬 자켓 추천",
      "블uetooth 헬멧 후기",
      "장갑·부츠 비교",
    ],
    titlePlaceholder: "예: 여름용 통풍 자켓 추천 부탁드려요",
    contentPlaceholder:
      "예산, 사용 계절, 체형·바이크 종류, 중요하게 보는 점을 함께 적어주세요.",
    badgeClass: "bg-violet-100 text-violet-800 ring-violet-200",
    cardClass: "border-violet-200 bg-violet-50/80 hover:border-violet-300",
  },
  모임: {
    label: "모임",
    emoji: "👥",
    summary: "크루·정기 라이딩",
    description:
      "크루·동호회 소개, 정기 라이딩 일정, 신규 멤버 모집 등 함께 달리는 모임 글을 올려요.",
    examples: [
      "서울 크루 7월 일정",
      "지역별 정기 모임",
      "신규 멤버 모집",
    ],
    titlePlaceholder: "예: 강서구 정기 라이딩 모임 7월 일정",
    contentPlaceholder:
      "모임 이름, 일정, 출발지·집합 시간, 참가 조건, 연락 방법을 적어주세요.",
    badgeClass: "bg-rose-100 text-rose-800 ring-rose-200",
    cardClass: "border-rose-200 bg-rose-50/80 hover:border-rose-300",
  },
};

export const writableBoardCategories = boardCategories.filter(
  (category): category is BoardCategory => category !== "전체"
);

export function getBoardCategoryMeta(
  category: BoardCategory | "전체"
): BoardCategoryMeta | null {
  if (category === "전체") return null;
  return boardCategoryMeta[category];
}

export function isBoardCategory(value: string): value is BoardCategory {
  return writableBoardCategories.includes(value as BoardCategory);
}

export type BoardComment = {
  id: string;
  author: string;
  authorId?: string;
  authorGradeId?: import("@/lib/ranking").MemberGradeId;
  content: string;
  upvotes: number;
  downvotes: number;
  /** 서버 전용 — API 응답에서는 제거 */
  votesBy?: Record<string, CommentVoteChoice>;
  createdAt: string;
};

export type CommentVoteChoice = "up" | "down";

export type BoardPost = {
  id: string;
  category: BoardCategory;
  title: string;
  author: string;
  authorId?: string;
  authorGradeId?: import("@/lib/ranking").MemberGradeId;
  content: string;
  imageUrls: string[];
  likes: number;
  /** 서버 전용 — API 응답에서는 제거 */
  likedBy?: string[];
  views: number;
  comments: BoardComment[];
  createdAt: string;
};

export type CreateBoardPostInput = {
  category: BoardCategory;
  title: string;
  author: string;
  authorId: string;
  authorGradeId?: import("@/lib/ranking").MemberGradeId;
  content: string;
  imageUrls?: string[];
};

export const seedBoardPosts: BoardPost[] = [
  {
    id: "seed-board-1",
    category: "자유",
    title: "이번 주말 강원도 라이딩 같이 가실 분?",
    author: "바람탄라이더",
    content:
      "토요일 아침 속초 쪽으로 갔다가 양양까지 돌고 오려고 합니다. 중급 정도 페이스로 갈 예정이에요. 같이 가실 분 댓글 남겨주세요!",
    imageUrls: [
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80",
    ],
    likes: 12,
    views: 128,
    comments: [
      {
        id: "bc-1",
        author: "강원러너",
        content: "저 관심 있습니다! 출발 시간 공유해 주세요.",
        upvotes: 4,
        downvotes: 0,
        createdAt: "2026-07-04T09:00:00.000Z",
      },
    ],
    createdAt: "2026-07-04T08:00:00.000Z",
  },
  {
    id: "seed-board-2",
    category: "정비",
    title: "체인 청소 주기 어떻게 관리하세요?",
    author: "정비초보",
    content:
      "장거리 탈 때마다 청소해야 하는지, 키로수 기준으로 관리하는지 궁금합니다. 사용 중인 체인 클리너 추천도 부탁드려요.",
    imageUrls: [],
    likes: 8,
    views: 89,
    comments: [],
    createdAt: "2026-07-03T10:30:00.000Z",
  },
  {
    id: "seed-board-3",
    category: "코스",
    title: "남해 일주 추천 코스 공유합니다",
    author: "해안로매니아",
    content:
      "마산 → 설리 → 독일마을 → 통영 루트 추천합니다. 휴식 포인트와 연료 보충 위치도 댓글로 정리해 둘게요.",
    imageUrls: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80",
    ],
    likes: 24,
    views: 203,
    comments: [
      {
        id: "bc-2",
        author: "남해라이더",
        content: "설리 쪽 카페 추천도 부탁드립니다!",
        upvotes: 2,
        downvotes: 0,
        createdAt: "2026-07-02T15:00:00.000Z",
      },
    ],
    createdAt: "2026-07-02T14:00:00.000Z",
  },
  {
    id: "seed-board-4",
    category: "장비",
    title: "여름용 메쉬 자켓 추천 부탁드려요",
    author: "썸머라이더",
    content:
      "통풍 잘 되면서 CE 인증된 제품 찾고 있습니다. 실사용 후기 위주로 추천 부탁드려요.",
    imageUrls: [],
    likes: 15,
    views: 156,
    comments: [],
    createdAt: "2026-07-01T11:00:00.000Z",
  },
  {
    id: "seed-board-5",
    category: "모임",
    title: "서울 강서구 정기 라이딩 모임 7월 일정",
    author: "강서크루",
    content:
      "매주 토요일 오전 7시 여의도 출발입니다. 7월 12일, 19일, 26일 일정 확정이에요. 신규 멤버 환영합니다.",
    imageUrls: [],
    likes: 9,
    views: 74,
    comments: [],
    createdAt: "2026-06-30T07:30:00.000Z",
  },
];

export function filterBoardPosts(options: {
  posts: BoardPost[];
  category?: (typeof boardCategories)[number];
  query?: string;
  sort?: "latest" | "popular";
}): BoardPost[] {
  const { posts, category = "전체", query = "", sort = "latest" } = options;

  const filtered = posts.filter((post) => {
    if (category !== "전체" && post.category !== category) return false;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const searchable = [post.title, post.author, post.content, post.category]
        .join(" ")
        .toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    if (sort === "popular") {
      return (
        b.likes + b.views + b.comments.length * 2 -
        (a.likes + a.views + a.comments.length * 2)
      );
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function normalizeBoardComment(comment: BoardComment): BoardComment {
  return {
    ...comment,
    upvotes: comment.upvotes ?? 0,
    downvotes: comment.downvotes ?? 0,
  };
}

export function normalizeBoardPost(post: BoardPost): BoardPost {
  return {
    ...post,
    imageUrls: post.imageUrls ?? [],
    views: post.views ?? 0,
    likes: post.likes ?? 0,
    comments: (post.comments ?? []).map(normalizeBoardComment),
  };
}

export function formatBoardDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatBoardListTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return date.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function getBoardPopularityScore(post: BoardPost): number {
  return post.likes + post.views + post.comments.length * 2;
}

export function getBoardThumbnail(post: BoardPost): string | null {
  return post.imageUrls[0] ?? null;
}

export function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function canManageBoardPost(
  user:
    | {
        id: string;
        nickname: string;
        isAdmin?: boolean;
        isOperator?: boolean;
      }
    | null
    | undefined,
  post: BoardPost
): boolean {
  if (!user) return false;
  if (user.isAdmin || user.isOperator) return true;
  if (post.authorId) return post.authorId === user.id;
  return post.author === user.nickname;
}
