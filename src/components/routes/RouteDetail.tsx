import type { BariRoute } from "@/lib/routes-data";
import { getPlacesForRoute } from "@/lib/places-data";
import { getRestStopsForRoute } from "@/lib/route-detail";
import { RoutePlacesSection } from "@/components/places/PlaceCard";
import RouteCommunityCafes from "@/components/routes/RouteCommunityCafes";
import BariRouteManageActions from "@/components/routes/BariRouteManageActions";
import RouteDifficultyPanel from "@/components/routes/RouteDifficultyPanel";
import RouteGpxDownload from "@/components/routes/RouteGpxDownload";
import RouteLinkActions from "@/components/routes/RouteLinkActions";
import RouteRestStopsPanel from "@/components/routes/RouteRestStopsPanel";
import type { RiderCafeEntry } from "@/lib/rider-cafe";

type RouteDetailProps = {
  route: BariRoute;
  communityCafes?: RiderCafeEntry[];
  onDeleted?: (routeId: number) => void;
};

export default function RouteDetail({
  route,
  communityCafes = [],
  onDeleted,
}: RouteDetailProps) {
  const places = getPlacesForRoute(route.id);
  const restStops = getRestStopsForRoute(route.id);

  return (
    <div className="space-y-6 rounded-3xl border border-signature/20 bg-white p-6 shadow-sm">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-signature-dark px-3 py-1 text-xs font-semibold text-white">
            {route.type}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {route.region}
          </span>
          <span className="rounded-full bg-signature-muted px-3 py-1 text-xs font-bold text-signature-darker">
            추천
          </span>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-800">{route.name}</h2>
        <p className="mt-2 text-sm leading-7 text-slate-500">{route.description}</p>
        {route.author ? (
          <p className="mt-2 text-xs text-slate-400">등록자 {route.author}</p>
        ) : null}
        <div className="mt-4 space-y-3">
          <RouteLinkActions
            routeId={route.id}
            waypoints={route.waypoints}
            routeName={route.name}
          />
          <BariRouteManageActions route={route} onDeleted={() => onDeleted?.(route.id)} />
        </div>
      </div>

      <RouteDifficultyPanel
        difficulty={route.difficulty}
        distanceKm={route.distanceKm}
        duration={route.duration}
      />

      <RouteGpxDownload routeId={route.id} routeName={route.name} />

      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-signature-light/70 px-4 py-3">
          <dt className="text-xs font-semibold text-signature-dark">출발 · 도착</dt>
          <dd className="mt-1 text-sm font-medium text-slate-800">
            {route.startPoint} → {route.endPoint}
          </dd>
        </div>
        <div className="rounded-2xl bg-signature-light/70 px-4 py-3">
          <dt className="text-xs font-semibold text-signature-dark">거리 · 소요</dt>
          <dd className="mt-1 text-sm font-medium text-slate-800">
            {route.distance} · {route.duration}
          </dd>
        </div>
        <div className="rounded-2xl bg-signature-light/70 px-4 py-3">
          <dt className="text-xs font-semibold text-signature-dark">추천 시즌</dt>
          <dd className="mt-1 text-sm font-medium text-slate-800">
            {route.bestSeason.join(", ")}
          </dd>
        </div>
        <div className="rounded-2xl bg-signature-light/70 px-4 py-3">
          <dt className="text-xs font-semibold text-signature-dark">휴식 스팟</dt>
          <dd className="mt-1 text-sm font-medium text-slate-800">
            {restStops.length}곳 · 라이더 평점 {route.rating}
          </dd>
        </div>
      </dl>

      <RouteRestStopsPanel
        routeId={route.id}
        stops={restStops}
        distanceKm={route.distanceKm}
      />

      <section>
        <h3 className="text-sm font-bold text-slate-800">주요 경유지</h3>
        <ol className="mt-3 space-y-2">
          {route.waypoints.map((wp, index) => (
            <li
              key={`${wp.name}-${index}`}
              className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signature-dark text-xs font-bold text-white">
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

      <RouteCommunityCafes route={route} entries={communityCafes} />

      <section>
        <h3 className="text-sm font-bold text-slate-800">코스 하이라이트</h3>
        <ul className="mt-3 space-y-2">
          {route.highlights.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-slate-600">
              <span className="text-signature-dark">•</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-bold text-slate-800">라이딩 팁</h3>
        <ul className="mt-3 space-y-2">
          {route.tips.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-slate-600">
              <span className="text-emerald-500">-</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {route.cautions.length > 0 && (
        <section className="rounded-2xl bg-amber-50 px-4 py-4">
          <h3 className="text-sm font-bold text-amber-900">주의사항</h3>
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
