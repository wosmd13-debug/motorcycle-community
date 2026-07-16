import Link from "next/link";
import { Suspense } from "react";
import SidebarAuth from "@/components/auth/SidebarAuth";
import HomeMissionPreview from "@/components/missions/HomeMissionPreview";
import MemberRankSidebar from "@/components/ranking/MemberRankSidebar";
import WeatherPreview, {
  WeatherPreviewSkeleton,
} from "@/components/weather/WeatherPreview";
import { filterBoardPosts } from "@/lib/board";
import { readBariRoutes } from "@/lib/bari-route-store";
import { readBoardPosts } from "@/lib/board-store";

async function PopularBoardRanking() {
  const posts = filterBoardPosts({
    posts: await readBoardPosts(),
    sort: "popular",
  }).slice(0, 8);

  return (
    <ol className="divide-y divide-[#f0ebe6]">
      {posts.map((post, index) => (
        <li key={post.id}>
          <Link
            href={`/board/${post.id}`}
            className="flex items-center gap-2 px-3 py-2 text-sm transition hover:bg-signature-light"
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center text-[11px] font-bold ${
                index < 3
                  ? "bg-signature text-white"
                  : "bg-stone-100 text-stone-400"
              }`}
            >
              {index + 1}
            </span>
            <span className="board-post-title board-post-title-clamp min-w-0 flex-1 text-stone-700">{post.title}</span>
            {post.comments.length > 0 && (
              <span className="shrink-0 text-xs font-semibold text-portal-accent">
                [{post.comments.length}]
              </span>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}

async function RouteRanking() {
  const bariRoutes = await readBariRoutes();
  const routes = [...bariRoutes]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  return (
    <ol className="divide-y divide-[#f0ebe6]">
      {routes.map((route, index) => (
        <li key={route.id}>
          <Link
            href="/routes"
            className="flex items-center gap-2 px-3 py-2 text-sm transition hover:bg-signature-light"
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center text-[11px] font-bold ${
                index < 3
                  ? "bg-signature/15 text-signature-dark"
                  : "bg-stone-100 text-stone-400"
              }`}
            >
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-stone-700">{route.name}</span>
            <span className="shrink-0 text-xs font-semibold text-signature">{route.rating}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export default function HomeSidebar() {
  return (
    <aside className="space-y-4">
      <SidebarAuth />

      <HomeMissionPreview />

      <MemberRankSidebar />

      <section className="portal-panel overflow-hidden">
        <div className="portal-panel-head">
          <h2 className="portal-panel-title">인기글 순위</h2>
          <span className="portal-badge">TOP</span>
        </div>
        <PopularBoardRanking />
      </section>

      <section className="portal-panel overflow-hidden">
        <div className="portal-panel-head">
          <h2 className="portal-panel-title">인기 코스</h2>
          <Link href="/routes" className="portal-panel-more">
            더보기
          </Link>
        </div>
        <RouteRanking />
      </section>

      <Suspense fallback={<WeatherPreviewSkeleton />}>
        <WeatherPreview compact />
      </Suspense>
    </aside>
  );
}
