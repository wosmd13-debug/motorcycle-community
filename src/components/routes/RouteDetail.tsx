import type { BariRoute } from "@/lib/routes-data";
import { getPlacesForRoute } from "@/lib/places-data";
import { RoutePlacesSection } from "@/components/places/PlaceCard";

type RouteDetailProps = {
  route: BariRoute;
};

export default function RouteDetail({ route }: RouteDetailProps) {
  const places = getPlacesForRoute(route.id);
  return (
    <div className="space-y-6 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
            {route.type}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {route.difficulty}
          </span>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-800">{route.name}</h2>
        <p className="mt-2 text-sm leading-7 text-slate-500">{route.description}</p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-orange-50/70 px-4 py-3">
          <dt className="text-xs font-semibold text-orange-600">출발 · 도착</dt>
          <dd className="mt-1 text-sm font-medium text-slate-800">
            {route.startPoint} → {route.endPoint}
          </dd>
        </div>
        <div className="rounded-2xl bg-orange-50/70 px-4 py-3">
          <dt className="text-xs font-semibold text-orange-600">거리 · 소요</dt>
          <dd className="mt-1 text-sm font-medium text-slate-800">
            {route.distance} · {route.duration}
          </dd>
        </div>
        <div className="rounded-2xl bg-orange-50/70 px-4 py-3">
          <dt className="text-xs font-semibold text-orange-600">추천 시즌</dt>
          <dd className="mt-1 text-sm font-medium text-slate-800">
            {route.bestSeason.join(", ")}
          </dd>
        </div>
        <div className="rounded-2xl bg-orange-50/70 px-4 py-3">
          <dt className="text-xs font-semibold text-orange-600">라이더 평점</dt>
          <dd className="mt-1 text-sm font-medium text-slate-800">
            ⭐ {route.rating} · 후기 {route.reviewCount}개
          </dd>
        </div>
      </dl>

      <section>
        <h3 className="text-sm font-bold text-slate-800">📍 주요 경유지</h3>
        <ol className="mt-3 space-y-2">
          {route.waypoints.map((wp, index) => (
            <li
              key={`${wp.name}-${index}`}
              className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{wp.name}</p>
                {wp.note && (
                  <p className="mt-0.5 text-xs text-slate-500">{wp.note}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <RoutePlacesSection routeId={route.id} places={places} />

      <section>
        <h3 className="text-sm font-bold text-slate-800">✨ 코스 하이라이트</h3>
        <ul className="mt-3 space-y-2">
          {route.highlights.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-slate-600">
              <span className="text-orange-500">•</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-bold text-slate-800">💡 라이딩 팁</h3>
        <ul className="mt-3 space-y-2">
          {route.tips.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-slate-600">
              <span className="text-emerald-500">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {route.cautions.length > 0 && (
        <section className="rounded-2xl bg-amber-50 px-4 py-4">
          <h3 className="text-sm font-bold text-amber-900">⚠️ 주의사항</h3>
          <ul className="mt-2 space-y-1">
            {route.cautions.map((item) => (
              <li key={item} className="text-sm text-amber-800">
                · {item}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
