import { filterRegions, matchesDetailRegion, type DetailRegion } from "@/lib/regions";

export const marketplaceTradeNotice = {
  title: "중고거래 안내",
  summary:
    "본 사이트는 회원 간 중고 거래 정보를 연결하는 공간입니다. 결제·배송·환불은 판매자와 구매자가 직접 협의하며, 운영자는 거래 당사자가 아닙니다.",
  privacyWarning:
    "전화번호, 실명, 상세 주소, 계좌번호 등 개인정보를 게시글·사진·댓글에 절대 올리지 마세요. 노출 시 즉시 삭제될 수 있으며, 개인정보 유출·사기 피해 위험이 있습니다.",
  prohibited: [
    "게시글·사진·댓글에 개인정보(전화번호, 주소, 계좌번호 등) 게시",
    "허위 매물·사기성 거래",
    "도난·불법 개조 부품",
    "미인증 안전용품(헬멧 등) 허위 표시",
    "연락처 도용·스팸성 연락 유도",
    "판매 완료 후 미삭제 허위 매물",
  ],
  footer:
    "직거래 시 공공장소에서 만나고, 선입금 사기에 주의해 주세요. 문제 매물은 신고해 주시면 운영자가 확인합니다.",
};

export const marketplaceCategories = [
  "전체",
  "헬멧",
  "자켓·의류",
  "장갑·부츠",
  "바이크 부품",
  "거치·전자기기",
  "기타",
] as const;

export type MarketplaceCategory = Exclude<
  (typeof marketplaceCategories)[number],
  "전체"
>;

export const marketplaceConditions = [
  "새것",
  "거의 새것",
  "사용감 있음",
  "사용감 많음",
] as const;

export type MarketplaceCondition = (typeof marketplaceConditions)[number];

export const marketplaceStatuses = ["판매중", "예약중", "판매완료"] as const;

export type MarketplaceStatus = (typeof marketplaceStatuses)[number];

export const marketplaceDeliveries = ["직거래", "택배", "직거래·택배"] as const;

export type MarketplaceDelivery = (typeof marketplaceDeliveries)[number];

export type CommentVoteChoice = "up" | "down";

export type MarketplaceComment = {
  id: string;
  author: string;
  content: string;
  upvotes: number;
  downvotes: number;
  /** 서버 전용 — API 응답에서는 제거 */
  votesBy?: Record<string, CommentVoteChoice>;
  createdAt: string;
};

export type MarketplaceItem = {
  id: string;
  category: MarketplaceCategory;
  title: string;
  description: string;
  price: number;
  condition: MarketplaceCondition;
  status: MarketplaceStatus;
  delivery: MarketplaceDelivery;
  imageUrls: string[];
  seller: string;
  sellerId: string;
  region: DetailRegion;
  location: string;
  contactMethod?: string;
  likes: number;
  /** 서버 전용 — API 응답에서는 제거 */
  likedBy?: string[];
  views: number;
  comments: MarketplaceComment[];
  createdAt: string;
  updatedAt?: string;
  statusUpdatedAt?: string;
  bumpedAt?: string;
};

export type CreateMarketplaceItemInput = {
  category: MarketplaceCategory;
  title: string;
  description: string;
  price: number;
  condition: MarketplaceCondition;
  delivery: MarketplaceDelivery;
  imageUrls?: string[];
  seller: string;
  sellerId: string;
  region: DetailRegion;
  location: string;
  contactMethod?: string;
};

export const marketplaceRegions = filterRegions;

export function formatMarketplacePrice(price: number): string {
  if (price <= 0) return "가격 문의";
  return `${price.toLocaleString("ko-KR")}원`;
}

export function formatMarketplaceDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function normalizeMarketplaceItem(item: MarketplaceItem): MarketplaceItem {
  return {
    ...item,
    imageUrls: item.imageUrls ?? [],
    likes: item.likes ?? 0,
    views: item.views ?? 0,
    comments: (item.comments ?? []).map((comment) => ({
      ...comment,
      upvotes: comment.upvotes ?? 0,
      downvotes: comment.downvotes ?? 0,
    })),
    status: item.status ?? "판매중",
    statusUpdatedAt: item.statusUpdatedAt,
    bumpedAt: item.bumpedAt,
  };
}

export const marketplaceStatusClass: Record<MarketplaceStatus, string> = {
  판매중: "bg-emerald-100 text-emerald-700",
  예약중: "bg-amber-100 text-amber-700",
  판매완료: "bg-stone-200 text-stone-600",
};

export const MARKETPLACE_BUMP_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function canManageMarketplaceItem(
  user:
    | {
        id: string;
        isAdmin?: boolean;
        isOperator?: boolean;
      }
    | null
    | undefined,
  item: MarketplaceItem
): boolean {
  if (!user) return false;
  return (
    user.id === item.sellerId ||
    Boolean(user.isAdmin) ||
    Boolean(user.isOperator)
  );
}

export function getMarketplaceSortTime(item: MarketplaceItem): number {
  return Math.max(
    new Date(item.bumpedAt ?? 0).getTime(),
    new Date(item.createdAt).getTime()
  );
}

export function canBumpMarketplaceItem(item: MarketplaceItem): boolean {
  if (!item.bumpedAt) return true;
  return (
    Date.now() - new Date(item.bumpedAt).getTime() >= MARKETPLACE_BUMP_COOLDOWN_MS
  );
}

export function getBumpCooldownLabel(item: MarketplaceItem): string | null {
  if (canBumpMarketplaceItem(item)) return null;
  const remainingMs =
    MARKETPLACE_BUMP_COOLDOWN_MS -
    (Date.now() - new Date(item.bumpedAt!).getTime());
  const hours = Math.ceil(remainingMs / (60 * 60 * 1000));
  return `${hours}시간 후 가능`;
}

export const seedMarketplaceItems: MarketplaceItem[] = [
  {
    id: "market-seed-1",
    category: "헬멧",
    title: "SHOEI GT-AIR II M사이즈 (거의 새것)",
    description:
      "1년 미만 사용, 내부 깨끗합니다. 선글라스 쉴드 포함. 직거래 우선, 택배 가능.",
    price: 420000,
    condition: "거의 새것",
    status: "판매중",
    delivery: "직거래·택배",
    imageUrls: [
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=900&q=80",
    ],
    seller: "라이더A",
    sellerId: "seed-seller-1",
    region: "수도권",
    location: "서울 마포구",
    contactMethod: "댓글",
    likes: 8,
    views: 54,
    comments: [],
    createdAt: "2026-07-01T09:00:00.000Z",
  },
  {
    id: "market-seed-2",
    category: "자켓·의류",
    title: "다이네즈 메쉬 자켓 L (여름용)",
    description:
      "통풍 좋은 메쉬 자켓입니다. 팔꿈치·어깨 보호대 포함. 한 시즌 사용.",
    price: 180000,
    condition: "사용감 있음",
    status: "판매중",
    delivery: "택배",
    imageUrls: [
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80",
    ],
    seller: "여름라이더",
    sellerId: "seed-seller-2",
    region: "경남",
    location: "부산 해운대구",
    contactMethod: "댓글",
    likes: 5,
    views: 31,
    comments: [],
    createdAt: "2026-07-03T11:20:00.000Z",
  },
  {
    id: "market-seed-3",
    category: "거치·전자기기",
    title: "휴대폰 무선 충전 거치대 (바이크 핸들 마운트)",
    description:
      "핸들바 마운트 포함. 충전 잘 됩니다. 기종 확인 후 구매해 주세요.",
    price: 35000,
    condition: "사용감 있음",
    status: "판매중",
    delivery: "직거래·택배",
    imageUrls: [
      "https://images.unsplash.com/photo-1609630875171-f761f4a6f268?auto=format&fit=crop&w=900&q=80",
    ],
    seller: "장비덕후",
    sellerId: "seed-seller-3",
    region: "수도권",
    location: "경기 성남시",
    likes: 2,
    views: 18,
    comments: [],
    createdAt: "2026-07-05T06:40:00.000Z",
  },
];

export type MarketplaceSort = "latest" | "popular" | "price-asc" | "price-desc";

export function filterMarketplaceItems({
  items,
  category = "전체",
  region = "전체",
  status = "전체",
  query = "",
  sort = "latest",
  sellerId,
  availableOnly = false,
}: {
  items: MarketplaceItem[];
  category?: (typeof marketplaceCategories)[number];
  region?: string;
  status?: MarketplaceStatus | "전체";
  query?: string;
  sort?: MarketplaceSort;
  sellerId?: string;
  availableOnly?: boolean;
}): MarketplaceItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  let filtered = items.filter((item) => {
    if (sellerId && item.sellerId !== sellerId) return false;
    if (availableOnly && item.status !== "판매중") return false;
    if (category !== "전체" && item.category !== category) return false;
    if (!matchesDetailRegion(item.region, region)) return false;
    if (status !== "전체" && item.status !== status) return false;

    if (!normalizedQuery) return true;

    const haystack = [
      item.title,
      item.description,
      item.seller,
      item.category,
      item.location,
      item.region,
      formatMarketplacePrice(item.price),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  filtered = [...filtered].sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "popular") {
      return b.views + b.likes - (a.views + a.likes);
    }
    return getMarketplaceSortTime(b) - getMarketplaceSortTime(a);
  });

  return filtered;
}
