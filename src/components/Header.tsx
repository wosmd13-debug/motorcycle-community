import Link from "next/link";

const navItems = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/routes", label: "바리 코스", icon: "🏍️" },
  { href: "/cafes", label: "라이더 카페", icon: "☕" },
  { href: "/board", label: "게시판", icon: "💬" },
  { href: "/map", label: "지도", icon: "🗺️" },
  { href: "/gallery", label: "갤러리", icon: "📸" },
  { href: "/weather", label: "날씨", icon: "☀️" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-orange-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🏍️</span>
          <div>
            <p className="text-lg font-bold text-slate-800">라이더모임</p>
            <p className="hidden text-xs text-slate-500 sm:block">
              오토바이 라이더 커뮤니티
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-orange-50 hover:text-orange-600"
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/cafes"
          className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
        >
          카페 등록
        </Link>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-orange-50 px-4 py-2 md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700"
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
