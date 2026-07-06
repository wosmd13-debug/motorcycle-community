import Link from "next/link";
import {
  getRouteLinkNote,
  placeCategoryEmoji,
  placeCategoryLabels,
  type RiderPlace,
} from "@/lib/places-data";

type PlaceCardProps = {
  place: RiderPlace;
  routeId?: number;
  compact?: boolean;
};

export default function PlaceCard({ place, routeId, compact = false }: PlaceCardProps) {
  const routeNote = routeId ? getRouteLinkNote(place, routeId) : undefined;
  const isPremium = place.promotion?.tier === "premium";

  return (
    <article
      className={`rounded-2xl border p-4 ${
        isPremium
          ? "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
          : place.isPartner
            ? "border-orange-200 bg-orange-50/40"
            : "border-slate-100 bg-slate-50/70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{placeCategoryEmoji[place.category]}</span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-slate-800">{place.name}</h4>
              {place.promotion?.badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isPremium
                      ? "bg-amber-500 text-white"
                      : "bg-orange-500 text-white"
                  }`}
                >
                  {place.promotion.badge}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {placeCategoryLabels[place.category]} · {place.address}
            </p>
          </div>
        </div>
      </div>

      {!compact && (
        <p className="mt-3 text-sm leading-6 text-slate-600">{place.description}</p>
      )}

      {routeNote && (
        <p className="mt-2 text-xs font-medium text-orange-600">📌 {routeNote}</p>
      )}

      {place.promotion?.headline && (
        <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-sm font-semibold text-orange-700">
          🎁 {place.promotion.headline}
          {place.promotion.offer && (
            <span className="mt-1 block text-xs font-normal text-slate-500">
              {place.promotion.offer}
            </span>
          )}
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
        <p className="mt-3 text-xs text-slate-400">🕐 {place.openHours}</p>
      )}
    </article>
  );
}

type RoutePlacesSectionProps = {
  routeId: number;
  places: RiderPlace[];
};

export function RoutePlacesSection({ routeId, places }: RoutePlacesSectionProps) {
  if (places.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/30 px-4 py-6 text-center">
        <p className="text-sm text-slate-500">
          이 코스에 등록된 라이더 스팟이 아직 없습니다.
        </p>
        <Link
          href="/partners"
          className="mt-3 inline-block text-sm font-semibold text-orange-500 hover:underline"
        >
          매장 홍보 등록하기 →
        </Link>
      </section>
    );
  }

  const partnerCount = places.filter((place) => place.isPartner).length;

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-800">
          ☕ 라이더 카페 & 휴식 스팟
        </h3>
        {partnerCount > 0 && (
          <span className="text-xs text-orange-600">
            제휴 {partnerCount}곳
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        코스 중간·종착 지점에서 쉬어가기 좋은 장소입니다.
      </p>
      <div className="mt-4 space-y-3">
        {places.map((place) => (
          <PlaceCard key={place.id} place={place} routeId={routeId} />
        ))}
      </div>
      <Link
        href="/partners"
        className="mt-4 inline-block text-xs font-semibold text-orange-500 hover:underline"
      >
        우리 매장도 등록하고 싶어요 →
      </Link>
    </section>
  );
}
