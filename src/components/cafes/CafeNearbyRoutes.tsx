import Link from "next/link";
import {
  buildMapHref,
  getRoutesForCafeRegion,
} from "@/lib/route-links";
import type { BariRoute } from "@/lib/routes-data";
import type { RiderCafeEntry } from "@/lib/rider-cafe";

export default function CafeNearbyRoutes({
  entry,
  bariRoutes,
}: {
  entry: RiderCafeEntry;
  bariRoutes: BariRoute[];
}) {
  const routes = getRoutesForCafeRegion(bariRoutes, entry.region).slice(0, 4);

  if (routes.length === 0) return null;

  return (
    <section className="mt-5 rounded-2xl border border-signature/20 bg-signature-light/50 px-4 py-4">
      <h3 className="text-sm font-bold text-slate-800">인근 바리 코스</h3>
      <p className="mt-1 text-xs text-slate-500">
        {entry.region} 지역에서 함께 즐기기 좋은 코스입니다.
      </p>
      <ul className="mt-3 space-y-2">
        {routes.map((route) => (
          <li key={route.id} className="flex gap-2">
            <Link
              href={`/routes?id=${route.id}`}
              className="flex-1 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 transition hover:ring-1 hover:ring-signature/30"
            >
              {route.name}
            </Link>
            <Link
              href={buildMapHref({ routeId: route.id })}
              className="shrink-0 rounded-xl border border-signature/30 bg-white px-3 py-2.5 text-xs font-semibold text-signature-dark hover:bg-signature-light"
            >
              지도
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={`/routes?q=${encodeURIComponent(entry.region)}`}
        className="mt-3 inline-block text-xs font-semibold text-signature-dark hover:underline"
      >
        코스 목록에서 더보기
      </Link>
    </section>
  );
}
