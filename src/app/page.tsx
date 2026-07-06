import FeatureCard from "@/components/FeatureCard";
import GalleryPreview from "@/components/gallery/GalleryPreview";
import WeatherPreview from "@/components/weather/WeatherPreview";
import Link from "next/link";
import { boardPosts } from "@/lib/mock-data";
import { bariRoutes } from "@/lib/routes-data";

const features = [
  {
    href: "/routes",
    emoji: "🏍️",
    title: "바리 코스",
    description: "투어·일주 코스를 거리, 난이도, 경유지, 팁까지 참고할 수 있어요.",
  },
  {
    href: "/cafes",
    emoji: "☕",
    title: "라이더 카페",
    description: "추천 카페의 주소와 사진을 공유하고 지역별로 찾아보세요.",
  },
  {
    href: "/board",
    emoji: "💬",
    title: "게시판",
    description: "라이딩 모집, 정비 팁, 장비 추천까지 자유롭게 이야기해요.",
  },
  {
    href: "/map",
    emoji: "🗺️",
    title: "라이딩 지도",
    description: "인기 코스와 라이더들이 추천하는 장소를 지도에서 확인해요.",
  },
  {
    href: "/gallery",
    emoji: "📸",
    title: "갤러리",
    description: "라이딩 인증샷과 바이크 사진을 공유하고 응원해요.",
  },
  {
    href: "/weather",
    emoji: "☀️",
    title: "라이딩 날씨",
    description: "출발 전 날씨와 바람 정보를 확인하고 안전하게 라이딩해요.",
  },
];

export default function Home() {
  return (
    <div className="bg-[#fff8f0]">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-[2rem] bg-gradient-to-br from-orange-400 via-amber-300 to-yellow-200 px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14">
          <p className="inline-flex rounded-full bg-white/20 px-4 py-1 text-sm font-medium">
            🏍️ 라이더들의 따뜻한 커뮤니티
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            바람과 함께하는
            <br />
            오토바이 라이더 모임
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-orange-50 sm:text-lg">
            코스 공유, 라이딩 모집, 사진 기록까지. 혼자가 아닌 함께 달리는
            즐거움을 나눠보세요.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/routes"
              className="rounded-full bg-white px-5 py-3 text-sm font-bold text-orange-600 shadow-sm transition hover:bg-orange-50"
            >
              바리 코스 보기
            </Link>
            <Link
              href="/map"
              className="rounded-full border border-white/70 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              추천 코스 지도
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.href} {...feature} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">🏍️ 인기 바리 코스</h2>
            <Link href="/routes" className="text-sm font-semibold text-orange-500">
              전체 보기
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {bariRoutes.slice(0, 4).map((route) => (
              <Link
                key={route.id}
                href="/routes"
                className="rounded-2xl border border-orange-50 bg-orange-50/50 p-4 transition hover:border-orange-200 hover:bg-orange-50"
              >
                <p className="text-xs font-semibold text-orange-600">{route.region}</p>
                <p className="mt-1 font-bold text-slate-800">{route.name}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {route.distance} · {route.difficulty} · ⭐ {route.rating}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">🔥 인기 게시글</h2>
            <Link href="/board" className="text-sm font-semibold text-orange-500">
              더보기
            </Link>
          </div>
          <div className="space-y-3">
            {boardPosts.slice(0, 3).map((post) => (
              <div
                key={post.id}
                className="rounded-2xl bg-orange-50/70 px-4 py-3"
              >
                <div className="flex items-center gap-2 text-xs text-orange-600">
                  <span className="rounded-full bg-white px-2 py-0.5 font-semibold">
                    {post.category}
                  </span>
                  <span>{post.author}</span>
                </div>
                <p className="mt-2 font-medium text-slate-800">{post.title}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <WeatherPreview />

          <GalleryPreview />
        </div>
      </section>
    </div>
  );
}
