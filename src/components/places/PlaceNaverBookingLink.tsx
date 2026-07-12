import { getNaverBookingUrl } from "@/lib/naver-booking";
import type { RiderPlace } from "@/lib/places-data";

type Props = {
  place: Pick<RiderPlace, "naverBookingUrl">;
  variant?: "button" | "compact";
  className?: string;
};

export default function PlaceNaverBookingLink({
  place,
  variant = "button",
  className = "",
}: Props) {
  const bookingUrl = getNaverBookingUrl(place);
  if (!bookingUrl) return null;

  if (variant === "compact") {
    return (
      <a
        href={bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 text-[11px] font-bold text-[#03c75a] hover:underline ${className}`}
      >
        네이버 예약 →
      </a>
    );
  }

  return (
    <a
      href={bookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-full bg-[#03c75a] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#02b350] ${className}`}
    >
      <NaverMark />
      네이버 예약
    </a>
  );
}

function NaverMark() {
  return (
    <span
      aria-hidden
      className="flex h-4 w-4 items-center justify-center rounded-sm bg-white text-[9px] font-black text-[#03c75a]"
    >
      N
    </span>
  );
}
