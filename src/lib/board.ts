import {
  getRootThreadComments,
  getThreadCommentReplies,
  normalizeThreadComment,
} from "@/lib/engagement-comments";

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
  /** 답글 대상 댓글 ID (최상위 댓글에만 답글 가능) */
  parentId?: string;
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
  /** 서버 전용 — 계정별 조회 기록 (API 응답에서는 제거) */
  viewedBy?: string[];
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
    content: `이번 주 토요일 MT-07 타고 강원 쪽으로 가볍게 다녀오려 합니다. 지난번에 혼자 속초까지 갔다가 돌아오는 길에 체력이 확 빠지더라고요. 그래서 이번에는 양양까지만 돌고, 중간에 같이 쉴 분이 있으면 좋겠다는 생각으로 글 올립니다.

출발은 토요일 아침 7시, 서울 잠실 부근에서 모이려고요. 고속도로만 타고 쭉 가는 코스는 아니고, 미시령 쪽 분위기도 잠깐 보고 내려올 생각입니다. 페이스는 시내 흐름에 맞추는 정도로, 무리해서 앞지르거나 과속할 일은 없어요. 초보 분도 부담 없이 따라오실 수 있게 앞뒤로 나눠 탈 예정입니다.

팁 하나 드리면, 아침 일찍 나가면 산간은 생각보다 춥습니다. 저는 메쉬 자켓 안에 얇은 이너를 하나 더 챙깁니다. 연료는 속초 들어가기 전에 한 번 채우는 게 마음 편했고, 양양 쪽은 주말에 카페 앞 주차가 붐비니 도로변 여유 공간 보고 서시는 게 좋아요.

주의할 점은 미시령·한계령 구간 그늘진 곳 노면입니다. 이슬 남아 있으면 미끄러울 수 있어서 코너 진입은 천천히 해주세요. 비 예보 있으면 일정은 바로 취소할게요.

같이 가실 분 기종·대략적인 라이딩 경험만 댓글로 남겨 주시면, 전날 밤에 집합 장소랑 카톡방 정리해서 공유드리겠습니다.`,
    imageUrls: [
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80",
    ],
    likes: 12,
    views: 128,
    comments: [
      {
        id: "bc-1",
        author: "강원러너",
        content:
          "Z900RS로 관심 있습니다. 지난주 양양 쪽 노면은 괜찮았는데 아침엔 안개가 끼더라고요. 7시 잠실이면 맞춰볼게요. 타이어는 여름용 그대로 갈 생각입니다.",
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
    content: `CB650R 산 지 반년쯤 됐는데, 체인 관리가 아직도 헷갈립니다. 정비소에서는 “키로수 보고 하세요”라고만 하시고, 커뮤니티마다 말이 달라서 제 기준을 잡고 싶어서 여쭤봅니다.

저는 출퇴근 + 주말 근교를 합치면 한 달에 대략 800~1,000km 타는 편이에요. 지난달 남양주 쪽으로 비 맞고 다녀온 뒤로는 체인이 유난히 까맣게 묻고, 가속할 때 쇳소리 비슷한 게 살짝 나서 불안하더라고요. 그때는 급하게 클리너 뿌리고 윤활제만 바르고 끝냈는데, 제대로 한 건지 모르겠습니다.

지금은 키로수 500~600km마다, 혹은 비·흙길 탄 다음 날 꼭 한 번씩 하려고 하는데요. 장거리 투어 다녀오면 그날 저녁에 바로 하는 게 맞을까요, 아니면 식히고 다음 날 해도 될까요?

쓰고 있는 건 시중에 흔한 스프레이형 클리너랑 끈적한 체인 루브입니다. 너무 많이 바르면 뒷휠이 지저분해져서 양을 줄였더니, 이번엔 건조해 보이는 느낌이 들어요. 초보 기준으로 청소→건조→윤활 순서나, “이 정도면 됐다” 싶은 감각 알려주시면 정말 도움 될 것 같습니다.

느낌상 체인을 방치하면 나중에 스프로킷까지 같이 갈아야 한다고 들어서, 지금 습관을 제대로 들이고 싶습니다. 실사용 주기랑 제품 추천 부탁드립니다.`,
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
    content: `지난 주말 Tracer 9으로 남해 쪽 다녀온 코스 정리해 봅니다. 마산 쪽에서 시작해 설리 해안 보고, 독일마을 들렀다가 통영으로 빠진 루트예요. 당일치기로는 꽤 알찼고, 풍경 대비 난이도는 중하 정도로 느꼈습니다.

오전 일찍 나가면 바닷바람이 시원해서 좋았습니다. 설리 구간은 사진 찍기 좋은데, 주말엔 차도 많고 주정차도 들쭉날쭉해서 시선은 전방 위주로 두세요. 독일마을은 경사가 있어서 저속 핸들링 익숙하지 않으면 발이 바쁠 수 있어요. 저는 마을 입구 쪽에 세워 두고 걸어 올라갔습니다.

연료는 통영 들어가기 전 큰 주유소에서 채우는 걸 추천합니다. 해안가 작은 곳은 주말에 줄이 길거나 영업 시간이 애매할 때가 있더라고요. 휴식은 그늘 있는 카페보다, 잠깐 바이크 세우고 바람 쐴 수 있는 공터를 이용하는 편이 편했습니다.

초보 분이면 고속도로 장거리보다 국도 페이스에 맞추는 게 덜 피곤합니다. 햇빛 강하니 선크림이랑 수분 꼭 챙기시고, 해안로는 모래·염분이 휠에 묻기 쉬워서 돌아오면 간단 세척만 해도 나중에 편해요.

주의할 건 해질 녘 역광입니다. 통영 쪽으로 시간 맞춰 들어가다 보면 시야가 순간적으로 흐려질 수 있어요. 저는 다음엔 일출 직후 출발해서 오전에 해안을 다 보고, 오후에 여유 있게 복귀할 생각입니다. 비슷한 코스 타신 분 휴식 포인트 있으면 댓글로 알려주세요.`,
    imageUrls: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80",
    ],
    likes: 24,
    views: 203,
    comments: [
      {
        id: "bc-2",
        author: "남해라이더",
        content:
          "설리 쪽이면 해안 카페 몇 군데 써봤는데, 주말 오전엔 주차 자리가 빨리 찹니다. Ninja 400으로 갔을 때 연비는 괜찮았고, 바닷바람 심해서 메쉬 자켓 추천해요.",
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
    content: `Ninja 650으로 출퇴근하는데, 요즘 낮 기온이 올라가서 가죽·텍스타일 자켓은 신호 대기만 해도 땀니다. 그래서 통풍 되는 메쉬 자켓으로 바꾸려는데, 리뷰만 보면 다 좋아 보여서 선택이 어렵네요.

원하는 조건은 CE 레벨 프로텍터가 어깨·팔꿈치에 들어 있는 것, 그리고 고속도로에서 팔랑거리지 않을 정도의 핏입니다. 작년에 저가형 메쉬를 썼더니 바람은 잘 통했는데, 야간에 기온 떨어질 때 너무 추워서 결국 안에 패딩을 또 껴입게 되더라고요. 그래서 탈부착 라이너가 있는지도 보고 있습니다.

실사용 기준으로 여쭤보고 싶은 건, 여름비 살짝 맞았을 때 안의 옷이 어느 정도까지 젖는지예요. 완전 방수는 기대 안 하지만, 잠깐 소나기에도 바로 축축해지면 출퇴근용으로는 부담스럽거든요. 헬멧이랑 글러브는 이미 맞춰 둔 상태라 자켓만 고민 중입니다.

체형은 168cm / 70kg 정도이고, 사이즈는 L을 주로 입습니다. 브랜드 상관없이 한두 시즌 이상 타보신 분 후기가 제일 듣고 싶어요. “통풍은 좋은데 봉제선이 거슬린다”, “프로텍터가 움직여서 불편하다” 같은 단점도 솔직히 적어 주시면 선택에 큰 도움이 됩니다.

참고로 저는 시내 비중 70%, 주말에 근교 국도 30% 정도입니다. 과하게 레이싱 핏보다는 일상에서 입고 내리기 편한 쪽이 맞을 것 같아요. 추천이랑 피해야 할 포인트 부탁드립니다.`,
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
    content: `강서·양천·영등포 쪽에서 타는 라이더들끼리 모인 소규모 정기 모임입니다. 거창한 동호회라기보다, 주말 아침에 같이 몸 풀고 근처 코스 한 바퀴 도는 분위기예요. 7월 일정이 잡혀서 관심 있는 분들께 공유합니다.

집합은 매주 토요일 오전 7시, 여의도 공원 인근 공터입니다. 확정된 날은 7월 12일, 19일, 26일이고, 코스는 그날 날씨 보고 한강변·김포 방면·근교 국도 중 하나로 정합니다. 왕복 대략 80~120km 안쪽이라 오전에 끝내고 점심 전에 해산하는 편입니다.

기종은 상관없습니다. 저희 쪽에는 PCX부터 MT-09, 투어러까지 섞여 있어요. 페이스는 맨 앞이 흐름에 맞추고, 초보 분은 중간~뒤에 두어 압박 없이 따라오시게 합니다. 첫 참석이시면 헬멧 통신기 없어도 되고, 출발 전에 수신호만 짧게 맞춥니다.

팁이라면, 아침 한강변은 바람이 생각보다 찹니다. 여름이라도 이너 하나 챙기시는 게 좋고, 주유는 집합 전에 미리 해 오시면 대기 시간이 줄어듭니다. 비 오는 날은 채팅으로 당일 취소합니다.

주의사항은 간단합니다. 음주·과속·차선 무시 없이, 교통법규 지키는 선에서만 같이 탑니다. 모임 중 촬영이 있을 수 있어 얼굴 공개가 부담이면 미리 말씀해 주세요.

신규 분 환영합니다. 오실 분은 기종이랑 대략 경력만 댓글에 남겨 주세요. 전날 밤에 집합 포인트 핀 다시 공유드릴게요.`,
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

export function getRootBoardComments(comments: BoardComment[]): BoardComment[] {
  return getRootThreadComments(comments);
}

export function getBoardCommentReplies(
  comments: BoardComment[],
  parentId: string
): BoardComment[] {
  return getThreadCommentReplies(comments, parentId);
}

export function normalizeBoardComment(comment: BoardComment): BoardComment {
  return normalizeThreadComment(comment);
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
