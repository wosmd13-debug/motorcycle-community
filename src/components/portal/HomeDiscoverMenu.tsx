import Link from "next/link";
import { DISCOVER_MENU } from "@/lib/home-portal";

const ICONS: Record<string, string> = {
  meetups: "모",
  news: "뉴",
  questions: "질",
  board: "글",
};

export default function HomeDiscoverMenu() {
  return (
    <section className="portal-panel home-reveal overflow-hidden">
      <div className="portal-panel-head">
        <h2 className="portal-panel-title">바로가기</h2>
      </div>
      <div className="home-discover-grid">
        {DISCOVER_MENU.map((item) => {
          const icon = ICONS[item.id] ?? item.label.slice(0, 1);
          const inner = (
            <>
              <span className="home-discover-icon">{icon}</span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-bold text-signature-dark">
                    {item.label}
                  </p>
                  {item.comingSoon && (
                    <span className="portal-badge">준비 중</span>
                  )}
                </span>
                <p className="mt-0.5 text-xs text-stone-500">{item.description}</p>
              </span>
            </>
          );

          if (item.comingSoon || !item.href) {
            return (
              <div
                key={item.id}
                className="home-discover-item is-disabled"
                aria-disabled
              >
                {inner}
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className="home-discover-item group"
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
