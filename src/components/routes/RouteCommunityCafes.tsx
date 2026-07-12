import Link from "next/link";
import {
  buildCafeHref,
  getCommunityCafesForRoute,
} from "@/lib/route-links";
import type { RiderCafeEntry } from "@/lib/rider-cafe";
import type { BariRoute } from "@/lib/routes-data";

type RouteCommunityCafesProps = {
  route: BariRoute;
  entries: RiderCafeEntry[];
};

export default function RouteCommunityCafes({
  route,
  entries,
}: RouteCommunityCafesProps) {
  const cafes = getCommunityCafesForRoute(route, entries);

  if (cafes.length === 0) return null;

  return (
    <section className="rounded-2xl border border-signature/15 bg-signature-light/30 px-4 py-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-stone-800">
          커뮤니티 등록 카페
        </h3>
        <Link
          href={buildCafeHref({ q: route.region })}
          className="text-xs font-semibold text-signature-dark hover:underline"
        >
          {route.region} 카페 더보기
        </Link>
      </div>
      <p className="mt-1 text-xs text-stone-500">
        이 코스 지역에 회원들이 등록한 바이크 카페입니다.
      </p>
      <ul className="mt-4 space-y-2">
        {cafes.map((cafe) => (
          <li key={cafe.id}>
            <Link
              href={buildCafeHref({ id: cafe.id, q: cafe.name })}
              className="block rounded-xl border border-white bg-white/80 px-4 py-3 transition hover:border-signature/30 hover:bg-white"
            >
              <p className="font-semibold text-stone-800">{cafe.name}</p>
              <p className="mt-1 text-xs text-stone-500">{cafe.address}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
