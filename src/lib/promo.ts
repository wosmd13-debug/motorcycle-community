import {
  emptyWeeklyOpenHours,
  formatDayOpenHours,
  formatTodayOpenHours,
  formatWeeklyOpenHoursSummary,
  getTodayWeekDay,
  hasWeeklyOpenHours,
  normalizeWeeklyOpenHours,
  weeklyHoursToSearchText,
  type WeeklyOpenHours,
} from "@/lib/rider-cafe-hours";

export const promoRulesNotice = {
  title: "자유홍보 이용 안내",
  summary:
    "채널·매장·행사·중고 거래 등 라이더 대상 홍보를 자유롭게 등록할 수 있습니다.",
  prohibited: [
    "음란물·성인물 및 불건전한 콘텐츠",
    "불법 촬영물, 아동·청소년 성착취물 등 법령 위반 영상·이미지",
    "사기, 허위·과장 광고, 불법 도박·다단계 등 불법 영업 홍보",
    "타인 비방·명예훼손, 저작권·초상권 침해",
    "스팸성 도배, 라이딩과 무관한 상업 광고",
  ],
  footer:
    "위반 게시물은 사전 통보 없이 삭제될 수 있으며, 반복 위반 시 이용이 제한될 수 있습니다.",
};

export const promoCategories = [
  "전체",
  "채널·SNS",
  "매장·업체",
  "세차장",
  "중고·거래",
  "행사·이벤트",
  "기타",
] as const;

export type PromoCategory = Exclude<
  (typeof promoCategories)[number],
  "전체"
>;

export const promoDisplayTypes = ["일반", "배너"] as const;

export type PromoDisplayType = (typeof promoDisplayTypes)[number];

export type CommentVoteChoice = "up" | "down";

export type PromoComment = {
  id: string;
  author: string;
  content: string;
  upvotes: number;
  downvotes: number;
  /** 서버 전용 — API 응답에서는 제거 */
  votesBy?: Record<string, CommentVoteChoice>;
  createdAt: string;
};

export type PromoPost = {
  id: string;
  category: PromoCategory;
  displayType: PromoDisplayType;
  title: string;
  author: string;
  authorId?: string;
  content: string;
  address?: string;
  phone?: string;
  businessHours?: string;
  businessWeeklyHours?: WeeklyOpenHours;
  businessStatus?: string;
  linkUrl?: string;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  imageUrls: string[];
  likes: number;
  /** 서버 전용 — API 응답에서는 제거 */
  likedBy?: string[];
  views: number;
  comments: PromoComment[];
  createdAt: string;
};

export type CreatePromoPostInput = {
  category: PromoCategory;
  displayType?: PromoDisplayType;
  title: string;
  author: string;
  authorId: string;
  content: string;
  address?: string;
  phone?: string;
  businessHours?: string;
  businessWeeklyHours?: WeeklyOpenHours;
  businessStatus?: string;
  linkUrl?: string;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  imageUrls?: string[];
};

export const promoBusinessCategories = ["매장·업체", "세차장"] as const;

export type PromoBusinessCategory = (typeof promoBusinessCategories)[number];

export function isPromoBusinessCategory(
  category: PromoCategory
): category is PromoBusinessCategory {
  return promoBusinessCategories.includes(category as PromoBusinessCategory);
}

export function hasPromoBusinessInfo(
  post: Pick<
    PromoPost,
    | "address"
    | "phone"
    | "businessHours"
    | "businessWeeklyHours"
    | "businessStatus"
  >
): boolean {
  return Boolean(
    post.address ||
      post.phone ||
      post.businessHours ||
      hasWeeklyOpenHours(post.businessWeeklyHours) ||
      post.businessStatus
  );
}

export function getPromoBusinessHoursText(
  post: Pick<PromoPost, "businessHours" | "businessWeeklyHours">
): string | undefined {
  if (hasWeeklyOpenHours(post.businessWeeklyHours)) {
    return (
      formatTodayOpenHours(post.businessWeeklyHours) ??
      formatWeeklyOpenHoursSummary(post.businessWeeklyHours) ??
      undefined
    );
  }

  return post.businessHours?.trim() || undefined;
}

export function parsePromoBusinessFields(body: Record<string, unknown>) {
  const address = String(body.address ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const businessStatus = String(body.businessStatus ?? "").trim();
  const businessWeeklyHours = normalizeWeeklyOpenHours(
    (body.businessWeeklyHours ?? body.weeklyHours) as
      | Partial<WeeklyOpenHours>
      | undefined
  );
  const legacyBusinessHours = String(body.businessHours ?? "").trim();
  const businessHours = businessWeeklyHours
    ? formatWeeklyOpenHoursSummary(businessWeeklyHours) || undefined
    : legacyBusinessHours || undefined;

  return {
    address: address || undefined,
    phone: phone || undefined,
    businessHours,
    businessWeeklyHours,
    businessStatus: businessStatus || undefined,
  };
}

export function promoBusinessValuesFromPost(post: PromoPost) {
  return {
    address: post.address ?? "",
    phone: post.phone ?? "",
    businessWeeklyHours:
      post.businessWeeklyHours ?? emptyWeeklyOpenHours(),
    businessStatus: post.businessStatus ?? "",
    legacyBusinessHours: post.businessHours ?? "",
  };
}

export function getEffectiveBusinessStatus(
  post: Pick<
    PromoPost,
    "businessStatus" | "businessHours" | "businessWeeklyHours"
  >
): string | undefined {
  if (post.businessStatus?.trim()) return post.businessStatus.trim();

  if (hasWeeklyOpenHours(post.businessWeeklyHours)) {
    const today = getTodayWeekDay();
    const day = post.businessWeeklyHours![today];
    return day.closed ? "휴무" : "영업중";
  }

  const hours = post.businessHours?.trim();
  if (!hours) return undefined;

  const normalized = hours.toLowerCase();
  if (
    normalized.includes("연중무휴") ||
    normalized.includes("24시") ||
    normalized.includes("24:00")
  ) {
    return "영업중";
  }

  if (normalized.includes("휴무")) {
    return "휴무";
  }

  return undefined;
}

export const promoCategoryMeta: Record<
  PromoCategory,
  { summary: string; description: string }
> = {
  "채널·SNS": {
    summary: "유튜브·인스타·블로그",
    description: "유튜브, 인스타그램, 블로그 등 SNS 채널 홍보",
  },
  "매장·업체": {
    summary: "카페·정비·용품점",
    description: "바이크 카페, 정비소, 용품점 등 매장·업체 홍보",
  },
  세차장: {
    summary: "셀프·바이크 세차",
    description:
      "셀프 세차장, 바이크 전용 세차, 체인·휠 세척 등 세차 업체 홍보. 위치, 영업시간, 가격, 라이더 할인 정보를 적어주세요.",
  },
  "중고·거래": {
    summary: "중고 바이크·용품",
    description: "중고 바이크, 헬멧, 용품 등 거래·판매 홍보",
  },
  "행사·이벤트": {
    summary: "모임·할인·이벤트",
    description: "크루 모임, 할인 행사, 구독자 이벤트 등",
  },
  기타: {
    summary: "기타 홍보",
    description: "위 분류에 해당하지 않는 기타 홍보",
  },
};

export const seedPromoPosts: PromoPost[] = [
  {
    id: "promo-seed-1",
    category: "채널·SNS",
    displayType: "일반",
    title: "[홍보] 주말 라이딩 브이로그 채널 구독 이벤트",
    author: "라이더로그",
    content:
      "주말 라이딩 브이로그를 올리고 있습니다. 구독자 100명 기념 헬멧 스티커 증정 이벤트 진행 중이에요. 많은 관심 부탁드립니다!",
    linkUrl: "https://www.youtube.com",
    youtubeUrl: "https://www.youtube.com/watch?v=ZhGhugh1F4s",
    youtubeVideoId: "ZhGhugh1F4s",
    imageUrls: [
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80",
    ],
    likes: 12,
    views: 186,
    comments: [
      {
        id: "pc-seed-1",
        author: "주말러",
        content: "구독했습니다! 좋은 영상 기대할게요.",
        upvotes: 1,
        downvotes: 0,
        createdAt: "2026-07-04T11:00:00.000Z",
      },
    ],
    createdAt: "2026-07-04T09:00:00.000Z",
  },
  {
    id: "promo-seed-2",
    category: "매장·업체",
    displayType: "배너",
    title: "[홍보] 팔당 라이더 휴게 카페 신메뉴 출시",
    author: "팔당카페",
    content:
      "라이더 전용 주차 공간과 세척존을 갖춘 카페입니다. 7월 한정 아이스 아메리카노 1+1 이벤트 진행 중!",
    address: "경기 남양주시 팔당면 팔당로 88",
    phone: "031-555-7890",
    businessHours: "매일 09:00 - 21:00",
    businessStatus: "영업중",
    linkUrl: "",
    imageUrls: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=80",
    ],
    likes: 8,
    views: 94,
    comments: [],
    createdAt: "2026-07-03T14:30:00.000Z",
  },
  {
    id: "promo-seed-3",
    category: "중고·거래",
    displayType: "일반",
    title: "[판매] AGV K6 헬멧 M사이즈 (거의 새것)",
    author: "헬멧판매",
    content:
      "3회 착용, 스크래치 없음. 박스·더스트백 포함. 직거래 서울 강서구, 택배 가능.",
    imageUrls: [
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=900&q=80",
    ],
    likes: 5,
    views: 67,
    comments: [],
    createdAt: "2026-07-02T10:00:00.000Z",
  },
  {
    id: "promo-seed-4",
    category: "세차장",
    displayType: "일반",
    title: "[홍보] 마산 바이크 세차 — 라이더 1,000원 할인",
    author: "마산세차",
    content:
      "남해 코스 전후 바이크 전용 세차 구역입니다. 체인·휠 세척 가능, 공기압 무료. 헬멧 착용 방문 시 1,000원 할인 적용.",
    address: "경남 창원시 마산합포구 합포로 120",
    phone: "055-123-4567",
    businessHours: "매일 08:00 - 22:00",
    businessStatus: "영업중",
    linkUrl: "https://map.naver.com",
    imageUrls: [
      "https://images.unsplash.com/photo-1601362840469-51e4d8d22985?auto=format&fit=crop&w=900&q=80",
    ],
    likes: 6,
    views: 41,
    comments: [],
    createdAt: "2026-07-08T09:00:00.000Z",
  },
];

export function canManagePromoPost(
  user:
    | {
        id: string;
        nickname: string;
        isAdmin?: boolean;
        isOperator?: boolean;
      }
    | null
    | undefined,
  post: PromoPost
): boolean {
  if (!user) return false;
  if (user.isAdmin || user.isOperator) return true;
  if (post.authorId) return post.authorId === user.id;
  return post.author === user.nickname;
}

export function getPromoCoverImage(post: PromoPost): string | null {
  if (post.imageUrls.length > 0) return post.imageUrls[0];
  if (post.youtubeVideoId) {
    return `https://img.youtube.com/vi/${post.youtubeVideoId}/hqdefault.jpg`;
  }
  return null;
}

export function isPromoBanner(post: PromoPost): boolean {
  return post.displayType === "배너";
}

export function filterPromoPosts(options: {
  posts: PromoPost[];
  category?: (typeof promoCategories)[number];
  query?: string;
  sort?: "latest" | "popular";
  displayType?: PromoDisplayType | "전체";
}): PromoPost[] {
  const {
    posts,
    category = "전체",
    query = "",
    sort = "latest",
    displayType = "전체",
  } = options;

  const filtered = posts.filter((post) => {
    if (category !== "전체" && post.category !== category) return false;
    if (displayType !== "전체" && post.displayType !== displayType) return false;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const searchable = [
        post.title,
        post.author,
        post.content,
        post.category,
        post.address ?? "",
        post.phone ?? "",
        post.businessHours ?? "",
        weeklyHoursToSearchText(post.businessWeeklyHours),
        post.businessStatus ?? "",
      ]
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

export function normalizePromoComment(comment: PromoComment): PromoComment {
  return {
    ...comment,
    upvotes: comment.upvotes ?? 0,
    downvotes: comment.downvotes ?? 0,
  };
}

export function normalizePromoPost(post: PromoPost): PromoPost {
  const businessWeeklyHours = normalizeWeeklyOpenHours(post.businessWeeklyHours);

  return {
    ...post,
    displayType: post.displayType ?? "일반",
    imageUrls: post.imageUrls ?? [],
    views: post.views ?? 0,
    likes: post.likes ?? 0,
    comments: (post.comments ?? []).map(normalizePromoComment),
    businessWeeklyHours,
    businessHours:
      businessWeeklyHours && !post.businessHours
        ? formatWeeklyOpenHoursSummary(businessWeeklyHours) || undefined
        : post.businessHours,
  };
}

export function parsePromoCategoryParam(
  value: string | undefined
): PromoCategory | null {
  if (!value) return null;
  const categories = promoCategories.filter(
    (category): category is PromoCategory => category !== "전체"
  );
  return categories.includes(value as PromoCategory)
    ? (value as PromoCategory)
    : null;
}

export function formatPromoDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
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
