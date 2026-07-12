import type { RiderPlace } from "@/lib/places-data";

const NAVER_BOOKING_HOSTS = [
  "hotels.naver.com",
  "map.naver.com",
  "pcmap.place.naver.com",
  "place.map.naver.com",
  "booking.naver.com",
  "nbooking.naver.com",
  "m.place.naver.com",
] as const;

/** 네이버 호텔 국내 숙소 ID로 예약(요금) 페이지 URL 생성 */
export function buildNaverHotelRatesUrl(domesticId: string | number): string {
  return `https://hotels.naver.com/accommodation/search/detail/domestic/${domesticId}/rates?entry=bikecommunity`;
}

export function isAllowedNaverBookingUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:") return false;
    return NAVER_BOOKING_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

export function getNaverBookingUrl(place: Pick<RiderPlace, "naverBookingUrl">): string | null {
  if (!place.naverBookingUrl) return null;
  return isAllowedNaverBookingUrl(place.naverBookingUrl) ? place.naverBookingUrl.trim() : null;
}

export function hasNaverBooking(place: Pick<RiderPlace, "naverBookingUrl">): boolean {
  return getNaverBookingUrl(place) !== null;
}

/** 지도 팝업 HTML (Leaflet 등) */
export function buildPlaceMapPopupHtml(
  place: Pick<RiderPlace, "name" | "category"> & {
    categoryLabel: string;
    offer?: string;
    naverBookingUrl?: string;
  }
): string {
  const bookingUrl = place.naverBookingUrl
    ? getNaverBookingUrl({ naverBookingUrl: place.naverBookingUrl })
    : null;

  const bookingButton = bookingUrl
    ? `<a href="${bookingUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;padding:6px 12px;border-radius:9999px;background:#03c75a;color:#fff;font-size:12px;font-weight:700;text-decoration:none;">네이버 예약</a>`
    : "";

  return `
    <div style="padding:10px 12px;font-family:sans-serif;min-width:160px;">
      <strong style="font-size:13px;color:#1e293b;">${escapeHtml(place.name)}</strong>
      <p style="margin:4px 0 0;font-size:12px;color:#64748b;">${escapeHtml(place.categoryLabel)}</p>
      ${
        place.offer
          ? `<p style="margin:4px 0 0;font-size:12px;color:#22c55e;font-weight:600;">${escapeHtml(place.offer)}</p>`
          : ""
      }
      ${bookingButton}
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
