export type SiteNavItem = {
  href: string;
  label: string;
  description?: string;
};

export type SiteNavGroup = {
  id: string;
  label: string;
  /** 부모 클릭 시 이동 (없으면 첫 자식 또는 드롭다운만) */
  href?: string;
  description?: string;
  children: SiteNavItem[];
};

/** 상단 부모 카테고리 + 하위 메뉴 */
export const navGroups: SiteNavGroup[] = [
  {
    id: "home",
    label: "홈",
    href: "/",
    description: "커뮤니티 메인",
    children: [],
  },
  {
    id: "board",
    label: "게시판",
    href: "/board",
    description: "자유·코스·정비·장비·모임",
    children: [
      {
        href: "/board",
        label: "전체 글",
        description: "자유게시판 전체 보기",
      },
      {
        href: "/board?category=자유",
        label: "자유",
        description: "잡담·질문·일상",
      },
      {
        href: "/board?category=코스",
        label: "코스",
        description: "코스·경로 추천",
      },
      {
        href: "/board?category=정비",
        label: "정비",
        description: "점검·수리·관리",
      },
      {
        href: "/board?category=장비",
        label: "장비",
        description: "헬멧·의류·용품",
      },
      {
        href: "/board?category=모임",
        label: "모임",
        description: "크루·정기 라이딩",
      },
      {
        href: "/ranking",
        label: "회원 랭킹",
        description: "활동·미션 포인트 순위",
      },
      {
        href: "/missions",
        label: "라이딩 미션",
        description: "일일·주간 미션과 출석",
      },
      {
        href: "/meetups",
        label: "라이딩 모임",
        description: "함께 달리는 일정",
      },
    ],
  },
  {
    id: "market",
    label: "홍보·거래",
    href: "/promo",
    description: "홍보·중고·세차",
    children: [
      {
        href: "/promo",
        label: "자유홍보",
        description: "업체·상품 홍보",
      },
      {
        href: "/marketplace",
        label: "중고거래",
        description: "바이크·용품 거래",
      },
      {
        href: "/promo?category=세차장",
        label: "세차장",
        description: "세차·디테일링",
      },
    ],
  },
  {
    id: "media",
    label: "갤러리·영상",
    href: "/gallery",
    description: "인증샷·유튜브",
    children: [
      {
        href: "/gallery",
        label: "갤러리",
        description: "라이딩 인증샷",
      },
      {
        href: "/videos",
        label: "영상",
        description: "유튜브·라이딩 영상",
      },
    ],
  },
  {
    id: "ride",
    label: "코스·장소",
    href: "/routes",
    description: "코스·카페·주유·지도",
    children: [
      {
        href: "/routes",
        label: "바리 코스",
        description: "추천 투어 코스",
      },
      {
        href: "/cafes",
        label: "바이크 카페",
        description: "라이더 카페 정보",
      },
      {
        href: "/services",
        label: "주유소",
        description: "근처 주유소 찾기",
      },
      {
        href: "/map",
        label: "지도",
        description: "전국 라이딩 지도",
      },
      {
        href: "/weather",
        label: "날씨",
        description: "라이딩 날씨 확인",
      },
    ],
  },
  {
    id: "my",
    label: "내 정보",
    href: "/garage",
    description: "차고·미션·상점",
    children: [
      {
        href: "/garage",
        label: "내 차고",
        description: "내 바이크 관리",
      },
      {
        href: "/missions",
        label: "라이딩 미션",
        description: "출석·일일·주간 미션",
      },
      {
        href: "/shop",
        label: "포인트 상점",
        description: "닉네임·프레임·칭호·부스트",
      },
      {
        href: "/ranking",
        label: "회원 랭킹",
        description: "내 순위 확인",
      },
      {
        href: "/feedback",
        label: "건의·문의",
        description: "버그·기능 건의·이용 문의",
      },
    ],
  },
];

/** 하위 호환: 평탄 목록이 필요할 때 */
export const primaryNav: SiteNavItem[] = navGroups.flatMap((group) => {
  if (group.children.length === 0 && group.href) {
    return [{ href: group.href, label: group.label }];
  }
  return group.children;
});

export const quickLinks: SiteNavItem[] = navGroups
  .filter((group) => group.children.length > 0)
  .flatMap((group) => group.children.slice(0, 3));

export function isNavHrefActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  const base = href.split("?")[0] ?? href;
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function isNavGroupActive(pathname: string, group: SiteNavGroup) {
  if (group.href && isNavHrefActive(pathname, group.href)) return true;
  return group.children.some((child) => isNavHrefActive(pathname, child.href));
}
