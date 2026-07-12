import Link from "next/link";

const menus = [
  { href: "/board", label: "자유게시판", desc: "자유·코스·정비·장비·모임", icon: "글" },
  { href: "/missions", label: "라이딩 미션", desc: "일일·주간 미션과 출석 스트릭", icon: "미" },
  { href: "/shop", label: "포인트 상점", desc: "포인트로 닉네임·칭호 꾸미기", icon: "상" },
  { href: "/promo", label: "자유홍보", desc: "채널·매장·행사 홍보", icon: "홍" },
  { href: "/marketplace", label: "중고거래", desc: "헬멧·자켓·부품 중고 거래", icon: "중" },
  { href: "/gallery", label: "갤러리", desc: "라이딩 인증샷·바이크 사진", icon: "사" },
  { href: "/videos", label: "영상", desc: "유튜브 채널·영상", icon: "영" },
  { href: "/routes", label: "바리 코스", desc: "투어·일주 코스 정보", icon: "코" },
  { href: "/cafes", label: "바이크 카페", desc: "추천 카페 등록·검색", icon: "카" },
  { href: "/meetups", label: "라이딩 모임", desc: "라이더 모임 일정·참가", icon: "모" },
  { href: "/garage", label: "내 차고", desc: "바이크·정비 기록", icon: "차" },
  { href: "/services", label: "주유소", desc: "주유소 지도", icon: "주" },
  { href: "/map", label: "지도", desc: "네이버 지도", icon: "지" },
  { href: "/weather", label: "날씨", desc: "라이딩 전 날씨 확인", icon: "날" },
];

export default function HomeQuickMenu() {
  return (
    <section className="portal-panel overflow-hidden">
      <div className="portal-panel-head">
        <h2 className="portal-panel-title">메뉴</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3">
        {menus.map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            className="group flex items-start gap-3 border-b border-r border-[#f0ebe6] px-4 py-3.5 transition hover:bg-signature-light sm:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0"
          >
            <span className="portal-menu-icon transition group-hover:scale-105 group-hover:border-signature/50">
              {menu.icon}
            </span>
            <span className="min-w-0">
              <p className="text-sm font-bold text-signature-dark group-hover:text-signature-darker">
                {menu.label}
              </p>
              <p className="mt-0.5 text-xs text-stone-500">{menu.desc}</p>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
