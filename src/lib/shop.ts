export type ShopItemKind =
  | "nickname_color"
  | "name_frame"
  | "title_badge"
  | "boost";

export type ShopEquipSlot = "nicknameColor" | "nameFrame" | "titleBadge";

export type ShopItemDefinition = {
  id: string;
  kind: ShopItemKind;
  name: string;
  description: string;
  price: number;
  /** 소모품(부스트)은 구매 즉시 적용, 재구매로 연장 */
  consumable?: boolean;
  durationDays?: number;
  slot?: ShopEquipSlot;
  /** CSS용 값 */
  value: string;
  previewClass: string;
  badgeLabel?: string;
};

export const SHOP_ITEMS: ShopItemDefinition[] = [
  {
    id: "color_emerald",
    kind: "nickname_color",
    name: "에메랄드 닉네임",
    description: "닉네임을 시그니처 그린으로 물들입니다",
    price: 80,
    slot: "nicknameColor",
    value: "text-emerald-600 dark:text-emerald-400",
    previewClass: "text-emerald-600 font-bold",
  },
  {
    id: "color_amber",
    kind: "nickname_color",
    name: "앰버 닉네임",
    description: "따뜻한 앰버 톤 닉네임",
    price: 80,
    slot: "nicknameColor",
    value: "text-amber-600 dark:text-amber-400",
    previewClass: "text-amber-600 font-bold",
  },
  {
    id: "color_sky",
    kind: "nickname_color",
    name: "스카이 닉네임",
    description: "시원한 하늘색 닉네임",
    price: 80,
    slot: "nicknameColor",
    value: "text-sky-600 dark:text-sky-400",
    previewClass: "text-sky-600 font-bold",
  },
  {
    id: "color_rose",
    kind: "nickname_color",
    name: "로즈 닉네임",
    description: "눈에 띄는 로즈 핑크 닉네임",
    price: 100,
    slot: "nicknameColor",
    value: "text-rose-600 dark:text-rose-400",
    previewClass: "text-rose-600 font-bold",
  },
  {
    id: "color_violet",
    kind: "nickname_color",
    name: "바이올렛 닉네임",
    description: "선명한 바이올렛 컬러 닉네임",
    price: 140,
    slot: "nicknameColor",
    value: "text-violet-600 dark:text-violet-400",
    previewClass: "text-violet-600 font-bold",
  },
  {
    id: "color_lime",
    kind: "nickname_color",
    name: "네온 라임 닉네임",
    description: "야간 라이딩 감성의 네온 라임 컬러",
    price: 160,
    slot: "nicknameColor",
    value: "text-lime-600 dark:text-lime-400",
    previewClass: "text-lime-600 font-bold",
  },
  {
    id: "color_racing_red",
    kind: "nickname_color",
    name: "레이싱 레드 닉네임",
    description: "강렬한 레이싱 레드 컬러 닉네임",
    price: 160,
    slot: "nicknameColor",
    value: "text-red-600 dark:text-red-400",
    previewClass: "text-red-600 font-bold",
  },
  {
    id: "color_silver",
    kind: "nickname_color",
    name: "실버 닉네임",
    description: "차분하고 세련된 메탈 실버 컬러",
    price: 180,
    slot: "nicknameColor",
    value: "text-slate-500 dark:text-slate-300",
    previewClass: "text-slate-500 font-bold",
  },
  {
    id: "frame_signature",
    kind: "name_frame",
    name: "시그니처 프레임",
    description: "닉네임 주변에 그린 링 프레임",
    price: 150,
    slot: "nameFrame",
    value: "shop-frame-signature",
    previewClass: "shop-frame-signature px-2 py-0.5",
  },
  {
    id: "frame_gold",
    kind: "name_frame",
    name: "골드 프레임",
    description: "프리미엄 골드 테두리",
    price: 220,
    slot: "nameFrame",
    value: "shop-frame-gold",
    previewClass: "shop-frame-gold px-2 py-0.5",
  },
  {
    id: "frame_carbon",
    kind: "name_frame",
    name: "카본 프레임",
    description: "다크 카본 스타일 프레임",
    price: 180,
    slot: "nameFrame",
    value: "shop-frame-carbon",
    previewClass: "shop-frame-carbon px-2 py-0.5",
  },
  {
    id: "frame_racing_checker",
    kind: "name_frame",
    name: "레이싱 체커 프레임",
    description: "서킷의 체커기를 담은 레이싱 프레임",
    price: 360,
    slot: "nameFrame",
    value: "shop-frame-racing-checker",
    previewClass: "shop-frame-racing-checker px-2 py-0.5",
  },
  {
    id: "frame_neon",
    kind: "name_frame",
    name: "네온 프레임",
    description: "어두운 화면에서도 빛나는 네온 프레임",
    price: 420,
    slot: "nameFrame",
    value: "shop-frame-neon",
    previewClass: "shop-frame-neon px-2 py-0.5",
  },
  {
    id: "frame_chrome",
    kind: "name_frame",
    name: "크롬 프레임",
    description: "바이크 파츠처럼 반짝이는 크롬 프레임",
    price: 460,
    slot: "nameFrame",
    value: "shop-frame-chrome",
    previewClass: "shop-frame-chrome px-2 py-0.5",
  },
  {
    id: "frame_tire_tread",
    kind: "name_frame",
    name: "타이어 트레드 프레임",
    description: "타이어 패턴을 표현한 라이더 전용 프레임",
    price: 500,
    slot: "nameFrame",
    value: "shop-frame-tire-tread",
    previewClass: "shop-frame-tire-tread px-2 py-0.5",
  },
  {
    id: "title_early_rider",
    kind: "title_badge",
    name: "칭호 · 얼리 라이더",
    description: "닉네임 옆에 ‘얼리 라이더’ 칭호 표시",
    price: 120,
    slot: "titleBadge",
    value: "얼리 라이더",
    previewClass: "shop-title-badge",
    badgeLabel: "얼리 라이더",
  },
  {
    id: "title_streak_king",
    kind: "title_badge",
    name: "칭호 · 출석왕",
    description: "꾸준한 출석을 자랑하는 칭호",
    price: 200,
    slot: "titleBadge",
    value: "출석왕",
    previewClass: "shop-title-badge shop-title-badge-amber",
    badgeLabel: "출석왕",
  },
  {
    id: "title_photo_pro",
    kind: "title_badge",
    name: "칭호 · 인증샷 프로",
    description: "갤러리 고수 느낌의 칭호",
    price: 180,
    slot: "titleBadge",
    value: "인증샷 프로",
    previewClass: "shop-title-badge shop-title-badge-violet",
    badgeLabel: "인증샷 프로",
  },
  {
    id: "title_weekend_rider",
    kind: "title_badge",
    name: "칭호 · 주말 라이더",
    description: "주말마다 도로로 나가는 라이더 칭호",
    price: 220,
    slot: "titleBadge",
    value: "주말 라이더",
    previewClass: "shop-title-badge shop-title-badge-sky",
    badgeLabel: "주말 라이더",
  },
  {
    id: "title_long_tourer",
    kind: "title_badge",
    name: "칭호 · 장거리 투어러",
    description: "먼 길도 즐겁게 달리는 투어러 칭호",
    price: 320,
    slot: "titleBadge",
    value: "장거리 투어러",
    previewClass: "shop-title-badge shop-title-badge-indigo",
    badgeLabel: "장거리 투어러",
  },
  {
    id: "title_cafe_tourer",
    kind: "title_badge",
    name: "칭호 · 카페 투어러",
    description: "라이더 카페 탐방을 즐기는 회원 칭호",
    price: 260,
    slot: "titleBadge",
    value: "카페 투어러",
    previewClass: "shop-title-badge shop-title-badge-rose",
    badgeLabel: "카페 투어러",
  },
  {
    id: "title_wrench_rookie",
    kind: "title_badge",
    name: "칭호 · 정비 꿈나무",
    description: "바이크 정비를 배워가는 회원 칭호",
    price: 240,
    slot: "titleBadge",
    value: "정비 꿈나무",
    previewClass: "shop-title-badge shop-title-badge-slate",
    badgeLabel: "정비 꿈나무",
  },
  {
    id: "title_communication_king",
    kind: "title_badge",
    name: "칭호 · 소통왕",
    description: "댓글과 응원으로 커뮤니티를 빛내는 칭호",
    price: 350,
    slot: "titleBadge",
    value: "소통왕",
    previewClass: "shop-title-badge shop-title-badge-lime",
    badgeLabel: "소통왕",
  },
  {
    id: "boost_post_7d",
    kind: "boost",
    name: "게시글 하이라이트 7일",
    description: "내 새 글·프로필에 하이라이트 효과가 7일간 적용됩니다",
    price: 250,
    consumable: true,
    durationDays: 7,
    value: "postHighlight",
    previewClass: "bg-amber-100 text-amber-800",
  },
  {
    id: "boost_gallery_7d",
    kind: "boost",
    name: "갤러리 스포트라이트 7일",
    description: "갤러리 카드에 스포트라이트 효과가 7일간 적용됩니다",
    price: 250,
    consumable: true,
    durationDays: 7,
    value: "gallerySpotlight",
    previewClass: "bg-violet-100 text-violet-800",
  },
];

export const SHOP_ITEM_MAP = Object.fromEntries(
  SHOP_ITEMS.map((item) => [item.id, item])
) as Record<string, ShopItemDefinition>;

export const SHOP_SIGNUP_BONUS = 50;

/** 운영자 상점 표시·구매용 무제한 포인트 */
export const OPERATOR_UNLIMITED_BALANCE = 9_999_999;

export type ShopWallet = {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  /** 미션 클레임에서 이미 지갑에 반영한 포인트 합 */
  missionCredited: number;
  signupBonusClaimed?: boolean;
};

export type ShopLedgerEntry = {
  id: string;
  userId: string;
  type: "earn" | "spend";
  amount: number;
  reason: string;
  refId?: string;
  createdAt: string;
};

export type ShopEquipped = {
  nicknameColor?: string;
  nameFrame?: string;
  titleBadge?: string;
};

export type ShopBoosts = {
  postHighlightUntil?: string;
  gallerySpotlightUntil?: string;
};

export type ShopInventory = {
  ownedItemIds: string[];
  equipped: ShopEquipped;
  boosts: ShopBoosts;
};

export type ShopFileData = {
  wallets: Record<string, ShopWallet>;
  inventories: Record<string, ShopInventory>;
  ledger: ShopLedgerEntry[];
};

export type ShopCosmeticLook = {
  nicknameClassName?: string;
  frameClassName?: string;
  titleBadge?: string;
  titleBadgeClassName?: string;
  postHighlightActive?: boolean;
  gallerySpotlightActive?: boolean;
};

export function emptyWallet(): ShopWallet {
  return {
    balance: 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
    missionCredited: 0,
    signupBonusClaimed: false,
  };
}

export function emptyInventory(): ShopInventory {
  return {
    ownedItemIds: [],
    equipped: {},
    boosts: {},
  };
}

export function getShopItem(id: string): ShopItemDefinition | undefined {
  return SHOP_ITEM_MAP[id];
}

export function isBoostActive(until?: string, now = new Date()): boolean {
  if (!until) return false;
  return new Date(until).getTime() > now.getTime();
}

export function buildCosmeticLook(
  inventory: ShopInventory | null | undefined,
  now = new Date()
): ShopCosmeticLook {
  if (!inventory) return {};

  const colorItem = inventory.equipped.nicknameColor
    ? getShopItem(inventory.equipped.nicknameColor)
    : undefined;
  const frameItem = inventory.equipped.nameFrame
    ? getShopItem(inventory.equipped.nameFrame)
    : undefined;
  const titleItem = inventory.equipped.titleBadge
    ? getShopItem(inventory.equipped.titleBadge)
    : undefined;

  return {
    nicknameClassName: colorItem?.value,
    frameClassName: frameItem?.value,
    titleBadge: titleItem?.badgeLabel ?? titleItem?.value,
    titleBadgeClassName: titleItem?.previewClass,
    postHighlightActive: isBoostActive(inventory.boosts.postHighlightUntil, now),
    gallerySpotlightActive: isBoostActive(
      inventory.boosts.gallerySpotlightUntil,
      now
    ),
  };
}

export function shopKindLabel(kind: ShopItemKind): string {
  switch (kind) {
    case "nickname_color":
      return "닉네임 색상";
    case "name_frame":
      return "이름 프레임";
    case "title_badge":
      return "칭호";
    case "boost":
      return "부스트";
    default:
      return "아이템";
  }
}
