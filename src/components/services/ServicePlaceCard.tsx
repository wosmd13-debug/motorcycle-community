import Link from "next/link";
import NaverNavButton from "@/components/routes/NaverNavButton";
import {
  placeCategoryLabels,
  placeCategoryMarker,
  type RiderPlace,
} from "@/lib/places-data";
import {
  buildMapHref,
  buildRouteHref,
  getRoutesForPlace,
} from "@/lib/route-links";
import type { BariRoute } from "@/lib/routes-data";

type ServicePlaceCardProps = {
  place: RiderPlace;
  selected?: boolean;
  bariRoutes?: BariRoute[];
  onSelect?: (id: string) => void;
};

export default function ServicePlaceCard({
  place,
  selected = false,
  bariRoutes = [],
  onSelect,
}: ServicePlaceCardProps) {
  const isFuel = place.category === "fuel";
  const linkedRoutes = getRoutesForPlace(bariRoutes, place).slice(0, 2);

  return (
    <article
      className={`rounded-2xl border p-4 transition ${
        selected
          ? "border-signature bg-signature-light/50 ring-2 ring-signature/30"
          : isFuel
            ? "border-green-100 bg-green-50/50 hover:border-green-200"
            : "border-sky-100 bg-sky-50/50 hover:border-sky-200"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect?.(place.id)}
        className="w-full text-left"
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              isFuel
                ? "bg-white text-green-700 ring-2 ring-green-500"
                : "bg-white text-sky-700 ring-2 ring-sky-500"
            }`}
          >
            {placeCategoryMarker[place.category]}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-slate-800">{place.name}</h3>
              {place.promotion?.badge && (
                <span className="rounded-full bg-signature-dark px-2 py-0.5 text-[10px] font-bold text-white">
                  {place.promotion.badge}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {placeCategoryLabels[place.category]} · {place.region}
            </p>
            <p className="mt-1 text-xs text-slate-400">{place.address}</p>
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600">{place.description}</p>

        {place.promotion?.headline && (
          <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-sm font-semibold text-signature-darker">
            {place.promotion.headline}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {place.amenities.map((item) => (
            <span
              key={item}
              className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-slate-600 ring-1 ring-slate-100"
            >
              {item}
            </span>
          ))}
        </div>

        {place.openHours && (
          <p className="mt-3 text-xs font-medium text-green-700">{place.openHours}</p>
        )}
      </button>

      <div className="mt-4 flex flex-wrap gap-2">
        <NaverNavButton
          waypoints={[{ lat: place.lat, lng: place.lng, name: place.name }]}
          compact
        />
        <Link
          href={buildMapHref({ placeId: place.id })}
          className="inline-flex items-center rounded-full border border-signature/30 bg-white px-3 py-1.5 text-xs font-semibold text-signature-dark hover:bg-signature-light"
        >
          전체 지도
        </Link>
        {linkedRoutes.map((route) => (
          <Link
            key={route.id}
            href={buildRouteHref(route.id)}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            {route.name}
          </Link>
        ))}
      </div>
    </article>
  );
}
