import Link from "next/link";
import PlaceNaverBookingLink from "@/components/places/PlaceNaverBookingLink";
import { hasNaverBooking } from "@/lib/naver-booking";
import {
  getRouteLinkNote,
  partitionRoutePlaces,
  placeCategoryLabels,
  type RiderPlace,
} from "@/lib/places-data";
import type { BariRoute } from "@/lib/routes-data";
import {
  buildCafeHref,
  buildMapHref,
  buildRouteHref,
  getRoutesForPlace,
} from "@/lib/route-links";

type PlaceCardProps = {
  place: RiderPlace;
  routeId?: number;
  bariRoutes?: BariRoute[];
  compact?: boolean;
};

export default function PlaceCard({
  place,
  routeId,
  bariRoutes = [],
  compact = false,
}: PlaceCardProps) {
  const routeNote = routeId ? getRouteLinkNote(place, routeId) : undefined;
  const isPremium = place.promotion?.tier === "premium";
  const isAccommodation = place.category === "accommodation";

  return (
    <article
      className={`rounded-2xl border p-4 ${
        isAccommodation
          ? "border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50/80"
          : isPremium
            ? "border-amber-200 bg-gradient-to-br from-signature-light to-signature-muted"
            : place.isPartner
              ? "border-signature/30 bg-signature-light/40"
              : "border-slate-100 bg-slate-50/70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-slate-800">{place.name}</h4>
              {place.promotion?.badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isPremium
                      ? "bg-signature-dark text-white"
                      : "bg-signature-dark text-white"
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

      {!compact && (
        <p className="mt-3 text-sm leading-6 text-slate-600">{place.description}</p>
      )}

      {routeNote && (
        <p className="mt-2 text-xs font-medium text-signature-dark">{routeNote}</p>
      )}

      {place.promotion?.headline && (
        <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-sm font-semibold text-signature-darker">
          {place.promotion.headline}
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
        <p className="mt-3 text-xs text-slate-400">{place.openHours}</p>
      )}

      {isAccommodation && hasNaverBooking(place) && !compact && (
        <div className="mt-4">
          <PlaceNaverBookingLink place={place} />
          <p className="mt-2 text-[11px] text-slate-400">
            네이버 예약 페이지에서 날짜·객실을 선택해 예약할 수 있습니다.
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {routeId && (
          <Link
            href={buildMapHref({ routeId, placeId: place.id })}
            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-signature-dark ring-1 ring-signature/30 hover:bg-signature-light"
          >
            지도에서 보기
          </Link>
        )}
        {place.category === "cafe" && (
          <Link
            href={buildCafeHref({ q: place.name })}
            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            카페 목록
          </Link>
        )}
        {routeId ? (
          <Link
            href={buildRouteHref(routeId)}
            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            코스 상세
          </Link>
        ) : (
          getRoutesForPlace(bariRoutes, place).slice(0, 2).map((route) => (
            <Link
              key={route.id}
              href={buildRouteHref(route.id)}
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              {route.name}
            </Link>
          ))
        )}
      </div>
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
      <section className="rounded-2xl border border-dashed border-signature/30 bg-signature-light/30 px-4 py-6 text-center">
        <p className="text-sm text-slate-500">
          이 코스에 등록된 라이더 스팟이 아직 없습니다.
        </p>
        <Link
          href="/partners"
          className="mt-3 inline-block text-sm font-semibold text-signature-dark hover:underline"
        >
          매장·숙소 홍보 등록하기 →
        </Link>
      </section>
    );
  }

  const { accommodations, others } = partitionRoutePlaces(places);
  const partnerCount = places.filter((place) => place.isPartner).length;

  return (
    <section className="space-y-6">
      {accommodations.length > 0 && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800">숙박업소 · 1박 이상</h3>
            <Link
              href={buildMapHref({ routeId })}
              className="text-xs font-semibold text-signature-dark hover:underline"
            >
              지도에서 보기
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            장거리·1박 2일 이상 여정에 참고할 수 있는 숙소입니다.{" "}
            <strong className="font-semibold text-[#03c75a]">네이버 예약</strong> 버튼으로
            바로 예약 페이지로 이동할 수 있습니다.
          </p>
          <div className="mt-4 space-y-3">
            {accommodations.map((place) => (
              <PlaceCard key={place.id} place={place} routeId={routeId} />
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800">
              {accommodations.length > 0 ? "휴식·식사·주유 스팟" : "바이크 카페 & 휴식 스팟"}
            </h3>
            {partnerCount > 0 && (
              <span className="text-xs text-signature-dark">
                제휴 {partnerCount}곳
              </span>
            )}
            {accommodations.length === 0 && (
              <Link
                href={buildMapHref({ routeId })}
                className="text-xs font-semibold text-signature-dark hover:underline"
              >
                지도에서 보기
              </Link>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            코스 중간·종착 지점에서 쉬어가기 좋은 장소입니다.
          </p>
          <div className="mt-4 space-y-3">
            {others.map((place) => (
              <PlaceCard key={place.id} place={place} routeId={routeId} />
            ))}
          </div>
        </div>
      )}

      <Link
        href="/partners"
        className="inline-block text-xs font-semibold text-signature-dark hover:underline"
      >
        우리 매장·숙소도 등록하고 싶어요 →
      </Link>
    </section>
  );
}
