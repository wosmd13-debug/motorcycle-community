import {
  getServicePlaces,
  placeCategoryLabels,
  placeCategoryMarker,
  type RiderPlace,
} from "@/lib/places-data";
import { buildDestinationNavLinkHtml } from "@/lib/naver-nav";

export const servicePlaceRegions = [
  "전체",
  "수도권",
  "강원",
  "경남",
  "경북",
  "제주",
  "전남",
] as const;

export type ServicePlaceRegion = (typeof servicePlaceRegions)[number];

export const serviceCategoryFilters = [
  { id: "all" as const, label: "전체" },
  { id: "fuel" as const, label: "주유소" },
];

export type ServiceCategoryFilter = (typeof serviceCategoryFilters)[number]["id"];

const categoryColors: Record<
  "fuel",
  { border: string; text: string; selectedBorder: string }
> = {
  fuel: { border: "#16a34a", text: "#16a34a", selectedBorder: "#15803d" },
};

export function filterServicePlaces({
  places,
  region,
  category,
  query,
}: {
  places: RiderPlace[];
  region: ServicePlaceRegion;
  category: ServiceCategoryFilter;
  query: string;
}): RiderPlace[] {
  const normalizedQuery = query.trim().toLowerCase();

  return places.filter((place) => {
    if (region !== "전체" && place.region !== region) return false;
    if (category !== "all" && place.category !== category) return false;
    if (!normalizedQuery) return true;

    const haystack = [
      place.name,
      place.address,
      place.description,
      place.region,
      placeCategoryLabels[place.category],
      ...(place.amenities ?? []),
      place.openHours ?? "",
      place.phone ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function getServicePlaceCenter(places: RiderPlace[]): {
  lat: number;
  lng: number;
} {
  if (places.length === 0) {
    return { lat: 36.5, lng: 127.8 };
  }

  const totals = places.reduce(
    (acc, place) => ({
      lat: acc.lat + place.lat,
      lng: acc.lng + place.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: totals.lat / places.length,
    lng: totals.lng / places.length,
  };
}

export function buildServiceMarkerHtml(
  place: RiderPlace,
  selected = false
): string {
  const colors =
    place.category === "fuel" ? categoryColors.fuel : categoryColors.fuel;
  const border = selected ? colors.selectedBorder : colors.border;
  const scale = selected ? "1.08" : "1";

  return `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9999px;background:#fff;border:2px solid ${border};box-shadow:0 2px 10px rgba(0,0,0,.18);font-size:12px;font-weight:700;color:${colors.text};transform:scale(${scale});">${placeCategoryMarker[place.category]}</div>`;
}

export function buildServiceInfoContent(place: RiderPlace): string {
  const amenities =
    place.amenities.length > 0
      ? `<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;">${place.amenities
          .slice(0, 4)
          .map(
            (item) =>
              `<span style="padding:2px 8px;border-radius:9999px;background:#f1f5f9;font-size:10px;color:#475569;">${item}</span>`
          )
          .join("")}</div>`
      : "";

  return `
    <div style="padding:12px 14px;min-width:200px;max-width:260px;border-radius:12px;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,.12);font-family:sans-serif;">
      <strong style="font-size:14px;color:#1e293b;">${place.name}</strong>
      <p style="margin:6px 0 0;font-size:11px;color:#64748b;">${placeCategoryLabels[place.category]} · ${place.region}</p>
      <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">${place.address}</p>
      ${place.openHours ? `<p style="margin:6px 0 0;font-size:11px;font-weight:600;color:#16a34a;">${place.openHours}</p>` : ""}
      ${amenities}
      ${buildDestinationNavLinkHtml({
        lat: place.lat,
        lng: place.lng,
        name: place.name,
      })}
    </div>
  `;
}

export function loadServicePlaces(): RiderPlace[] {
  return getServicePlaces();
}
