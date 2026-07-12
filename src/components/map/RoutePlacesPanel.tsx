import Link from "next/link";
import PlaceNaverBookingLink from "@/components/places/PlaceNaverBookingLink";
import { hasNaverBooking } from "@/lib/naver-booking";
import {
  getPlacesForRoute,
  getRouteLinkNote,
  partitionRoutePlaces,
  placeCategoryLabels,
} from "@/lib/places-data";
import { buildMapHref, buildRouteHref } from "@/lib/route-links";

type RoutePlacesPanelProps = {
  routeId: number;
  highlightPlaceId?: string;
  onHighlightPlace?: (placeId: string) => void;
};

function PlaceListItem({
  place,
  routeId,
  highlightPlaceId,
  onHighlightPlace,
}: {
  place: ReturnType<typeof getPlacesForRoute>[number];
  routeId: number;
  highlightPlaceId?: string;
  onHighlightPlace?: (placeId: string) => void;
}) {
  const isActive = place.id === highlightPlaceId;
  const note = getRouteLinkNote(place, routeId);
  const isAccommodation = place.category === "accommodation";

  return (
    <li>
      <button
        type="button"
        onClick={() => onHighlightPlace?.(place.id)}
        className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
          isActive
            ? "border-signature/40 bg-signature-light ring-2 ring-signature/30"
            : isAccommodation
              ? "border-violet-100 bg-violet-50/80 hover:border-violet-200"
              : "border-slate-100 bg-slate-50/80 hover:border-signature/30"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-slate-800">{place.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {placeCategoryLabels[place.category]}
              {note ? ` · ${note}` : ""}
            </p>
          </div>
                    <Link
                      href={buildMapHref({ routeId, placeId: place.id })}
                      onClick={(event) => event.stopPropagation()}
                      className="shrink-0 text-[11px] font-semibold text-signature-dark hover:underline"
                    >
                      고정
                    </Link>
                  </div>
                  {isAccommodation && hasNaverBooking(place) ? (
                    <div className="mt-2" onClick={(event) => event.stopPropagation()}>
                      <PlaceNaverBookingLink place={place} variant="compact" />
                    </div>
                  ) : null}
      </button>
    </li>
  );
}

export default function RoutePlacesPanel({
  routeId,
  highlightPlaceId,
  onHighlightPlace,
}: RoutePlacesPanelProps) {
  const places = getPlacesForRoute(routeId);
  const { accommodations, others } = partitionRoutePlaces(places);

  return (
    <div className="space-y-3 border-t border-signature/20 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-800">
          코스 연결 스팟 {places.length}곳
        </h3>
        <Link
          href={buildRouteHref(routeId)}
          className="text-xs font-semibold text-signature-dark hover:underline"
        >
          코스 상세
        </Link>
      </div>

      {places.length === 0 ? (
        <p className="text-xs text-slate-500">등록된 휴식 스팟이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {accommodations.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold text-violet-700">
                숙박업소 · 1박 이상
              </p>
              <ul className="space-y-2">
                {accommodations.map((place) => (
                  <PlaceListItem
                    key={place.id}
                    place={place}
                    routeId={routeId}
                    highlightPlaceId={highlightPlaceId}
                    onHighlightPlace={onHighlightPlace}
                  />
                ))}
              </ul>
            </div>
          )}

          {others.length > 0 && (
            <div>
              {accommodations.length > 0 && (
                <p className="mb-2 text-[11px] font-semibold text-slate-600">
                  휴식·식사·주유
                </p>
              )}
              <ul className="space-y-2">
                {others.map((place) => (
                  <PlaceListItem
                    key={place.id}
                    place={place}
                    routeId={routeId}
                    highlightPlaceId={highlightPlaceId}
                    onHighlightPlace={onHighlightPlace}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
