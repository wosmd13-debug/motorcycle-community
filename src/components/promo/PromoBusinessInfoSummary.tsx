"use client";

import type { PromoPost } from "@/lib/promo";
import {
  getEffectiveBusinessStatus,
  getPromoBusinessHoursText,
  hasPromoBusinessInfo,
} from "@/lib/promo";

type PromoBusinessInfoSummaryProps = {
  post: Pick<
    PromoPost,
    | "address"
    | "phone"
    | "businessHours"
    | "businessWeeklyHours"
    | "businessStatus"
  >;
  variant?: "card" | "banner" | "inline";
};

function getBusinessStatusClass(
  status: string,
  variant: "card" | "banner" | "inline"
) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("영업") ||
    normalized.includes("open") ||
    normalized.includes("운영")
  ) {
    return variant === "banner"
      ? "bg-emerald-500/90 text-white"
      : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }

  if (
    normalized.includes("휴무") ||
    normalized.includes("마감") ||
    normalized.includes("종료") ||
    normalized.includes("closed")
  ) {
    return variant === "banner"
      ? "bg-stone-500/90 text-white"
      : "bg-stone-100 text-stone-600 ring-1 ring-stone-200";
  }

  return variant === "banner"
    ? "bg-white/20 text-white"
    : "bg-signature-light text-signature-dark ring-1 ring-signature/20";
}

export default function PromoBusinessInfoSummary({
  post,
  variant = "card",
}: PromoBusinessInfoSummaryProps) {
  if (!hasPromoBusinessInfo(post)) return null;

  const businessStatus = getEffectiveBusinessStatus(post);
  const businessHoursText = getPromoBusinessHoursText(post);

  if (variant === "inline") {
    const parts = [
      businessStatus,
      post.phone,
      post.address,
      businessHoursText,
    ].filter(Boolean);

    if (parts.length === 0) return null;

    return (
      <p className="mt-0.5 truncate text-[11px] text-stone-500">
        {parts.join(" · ")}
      </p>
    );
  }

  if (variant === "card") {
    return (
      <div className="mt-2 space-y-1.5">
        {businessStatus && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-stone-500">영업 현황</span>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${getBusinessStatusClass(
                businessStatus,
                variant
              )}`}
            >
              {businessStatus}
            </span>
          </div>
        )}

        {post.phone && (
          <p className="text-sm text-stone-700">
            📞{" "}
            <a
              href={`tel:${post.phone.replace(/[^\d+]/g, "")}`}
              onClick={(event) => event.stopPropagation()}
              className="font-semibold text-signature-dark hover:underline"
            >
              {post.phone}
            </a>
          </p>
        )}

        {post.address && (
          <p className="text-sm leading-6 text-stone-600">📍 {post.address}</p>
        )}

        {businessHoursText && (
          <p className="text-xs text-stone-500">🕐 {businessHoursText}</p>
        )}
      </div>
    );
  }

  const labelClass =
    "text-[10px] font-semibold uppercase tracking-wide text-white/70";
  const valueClass = "text-sm text-white/95";
  const phoneClass = "text-sm font-semibold text-white";

  return (
    <div className="mt-3 space-y-2 rounded-xl bg-black/25 px-3 py-2.5 backdrop-blur-sm">
      {businessStatus && (
        <div className="flex flex-wrap items-center gap-2">
          <span className={labelClass}>영업 현황</span>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${getBusinessStatusClass(
              businessStatus,
              variant
            )}`}
          >
            {businessStatus}
          </span>
        </div>
      )}

      {post.phone && <p className={phoneClass}>📞 {post.phone}</p>}

      {post.address && (
        <p className={`leading-5 ${valueClass}`}>📍 {post.address}</p>
      )}

      {businessHoursText && (
        <p className={`text-xs text-white/85`}>🕐 {businessHoursText}</p>
      )}
    </div>
  );
}
