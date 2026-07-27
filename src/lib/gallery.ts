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

export type GalleryPost = {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  authorGradeId?: import("@/lib/ranking").MemberGradeId;
  location: string;
  category: GalleryCategory;
  imageUrl: string;
  caption?: string;
  likes: number;
  /** 서버 전용 — API 응답에서는 제거 */
  likedBy?: string[];
  views: number;
  comments: GalleryComment[];
  createdAt: string;
};

export type CreateGalleryPostInput = {
  title: string;
  author: string;
  authorId: string;
  authorGradeId?: import("@/lib/ranking").MemberGradeId;
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
    caption: `MT-07 타고 새벽 4시쯤 서울을 나와 속초 해안도로에서 일출을 맞았습니다. 날이 맑아서 수평선이 또렷했고, 바람은 차가웠지만 해가 뜨니 금방 풀리더라고요. 노면은 전반적으로 깨끗했는데, 그늘진 구간은 이슬이 남아 있어서 코너 진입은 천천히 했습니다.

사진 찍은 곳은 해변 주차장 쪽입니다. 주말 오전인데도 일찍 가니 자리 여유가 있었고, 바이크 세우고 잠깐 쉬기 좋았어요. 커피 한잔하며 파도 소리 듣고 있으면 장거리 피로가 좀 풀립니다. 초보 분이면 고속도로보다 해안 국도 페이스에 맞추는 게 덜 피곤하고, 연비도 무리 없이 나왔습니다.

이너 하나 챙기시고, 복귀길 역광만 조심하세요. 타이어 공기압은 출발 전에 한 번 더 보는 걸 추천합니다. 다음에도 같은 타이밍이면 또 와 보고 싶은 속초 해안 코스입니다.`,
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
    caption: `구례에서 출발해 Tracer 9으로 지리산 방면 능선 뷰 포인트까지 다녀왔습니다. 날씨는 구름 조금 있는 맑음이었고, 산간이라 그늘진 곳은 기온이 확실히 낮았어요. 노면은 대체로 양호했지만 낙엽·잔모래 있는 코너가 있어 앞타이어에 무게를 두고 탔습니다.

전망 좋은 쉼터에서 인증샷 찍고 물 마시며 쉬기 딱 좋았습니다. 같은 크루 분들과 서스펜션 느낌도 잠깐 이야기했는데, 적재 없이도 노면 충격이 잘 걸러지더라고요. 초보 분은 저단으로 엔진 브레이크 활용하시고, 내려갈 때 과속하지 마세요.

주유는 구례·남원 큰 주유소에서 미리 채우는 걸 추천합니다. 해 지기 전에 내려오는 일정으로 잡으면 마음 편합니다. 글러브는 여름용이라도 여분 이너를 챙기면 좋습니다. 산간은 날씨가 갑자기 바뀌니 우비도 가방에 넣어 두세요.`,
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
    caption: `서귀포 쪽 1132번 해안도로를 CB400으로 달리다가 에메랄드빛 바다가 열려서 바로 세우고 찍었습니다. 바람은 세했지만 하늘이 맑아 물색이 정말 예뻤어요. 노면은 전반적으로 매끈했고, 다만 해무가 잠깐 끼는 구간은 시야가 줄어드니 속도를 낮췄습니다.

중간중간 공터·카페 앞이 쉬어가기 좋습니다. 주말 오후는 렌트카가 많아서 추월은 웬만하면 참는 게 안전합니다. 연비는 해안 정속 주행이라 생각보다 무난했고, 체인에 염분·모래가 묻기 쉬워 숙소 도착 후 간단 세척만 했습니다.

초보 분이면 오전에 해안을 돌고 오후에 카페 쉬는 일정을 추천해요. 바닷바람 때문에 메쉬만 입으면 추울 수 있어 얇은 이너를 챙겼더니 편했습니다. 헬멧 쉴드에 소금기가 묻으면 시야가 흐려지니 휴지 하나 챙기세요. 서귀포 쪽은 일몰 전 복귀를 권합니다.`,
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
    caption: `제천 의림지 인근을 XMAX로 돌다가 단풍이 한창이라 인증샷 남겼습니다. 가을 햇살은 좋았는데 그늘진 산길은 벌써 쌀쌀해서 글러브는 두툼한 걸 썼어요. 노면은 대체로 깨끗했지만 낙엽 쌓인 코너가 있어 미끄러움에 주의했습니다. 타이어가 반 이상 닳았다면 이 시즌엔 교체를 한 번 고민해 보세요.

주차하고 산책로 쪽 벤치에서 쉬기 좋고, 사진도 배경이 잘 나옵니다. 단풍 시즌엔 차량이 붐비니 평일 오전을 추천합니다. 초보 분은 앞차 간격 넉넉히 두시고, 브레이크는 앞·뒤를 같이 부드럽게 쓰세요.

복귀 전 타이어 공기압만 한 번 체크해도 마음이 놓입니다. 저는 근처 카페에서 손 녹이며 다음 코스를 짧게 상의하고 내려왔습니다. 단풍 절정이면 주차장이 빨리 차니, 아침 일찍 여유 있게 출발하는 편이 훨씬 낫습니다.`,
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
    caption: `용인에서 인도받은 첫 바이크, MT-03과 찍은 기념 사진입니다. 날씨는 맑고 바람은 약해서 주차장이 한산할 때 천천히 촬영했어요. 아직 장거리는 무리이고, 근처 국도로 짧게 테스트 라이딩만 했습니다. 노면은 평지라 부담 없었고, 신호 대기 때 균형 잡는 연습이 제일 긴장이 되더라고요.

초보라면 보호구부터 맞추고, 처음 며칠은 익숙한 동네만 도는 걸 추천합니다. 친구들과 카페에서 쉬며 세팅·연비 이야기도 나누니 긴장이 좀 풀렸습니다. 정비소에서 체인 장력만 한번 봐 달라고 하니 마음이 놓이더라고요.

타이어는 신품이라 접지감이 낯설 수 있으니 코너에서 욕심내지 마세요. 저도 조금씩 거리 늘려가려 합니다. 비 오는 날은 억지로 나가지 않는 게 제 원칙입니다. 보호구 착용하고 찍으니 기념 사진도 더 뿌듯하네요.`,
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
    caption: `주말 아침 한강변으로 크루 단체 라이딩 나갔습니다. PCX부터 Ninja 650, 투어러까지 섞여 있었고, 저는 Z650으로 중간에서 페이스 맞췄어요. 날씨는 흐림 조금 있는 맑음, 노면은 건조해서 컨디션이 좋았습니다. 다만 주말엔 자전거·조깅이 많아 시선 분산에 주의했습니다.

여의도 쪽에서 모여 한 바퀴 돌고, 카페에서 쉬며 사진 찍었습니다. 초보 분들은 맨 뒤에 두어 압박 없이 따라오게 했고, 수신호만 간단히 맞췄어요. 단체로 달릴 땐 차간 거리와 차선 변경 타이밍이 제일 중요합니다.

여름이라도 아침 한강 바람은 차가우니 이너 하나 챙기세요. 타이어 상태는 출발 전 서로 한번씩 봐 주는 습관을 들이니 마음이 편합니다. 다음엔 김포 쪽 국도도 짧게 붙여 볼 생각입니다. 단체 라이딩은 안전이 우선이라는 걸 다시 느꼈습니다.`,
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
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function canManageGalleryPost(
  user:
    | {
        id: string;
        nickname: string;
        isAdmin?: boolean;
        isOperator?: boolean;
      }
    | null
    | undefined,
  post: GalleryPost
): boolean {
  if (!user) return false;
  if (user.isAdmin || user.isOperator) return true;
  if (post.authorId) return post.authorId === user.id;
  return post.author === user.nickname;
}
