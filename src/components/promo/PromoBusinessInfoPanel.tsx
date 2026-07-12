import type { PromoPost } from "@/lib/promo";
import {
  getEffectiveBusinessStatus,
  getPromoBusinessHoursText,
  hasPromoBusinessInfo,
} from "@/lib/promo";
import PromoWeeklyHoursPanel from "@/components/promo/PromoWeeklyHoursPanel";
import { hasWeeklyOpenHours } from "@/lib/rider-cafe-hours";

export default function PromoBusinessInfoPanel({ post }: { post: PromoPost }) {
  if (!hasPromoBusinessInfo(post)) return null;

  const mapQuery = post.address ? encodeURIComponent(post.address) : null;
  const businessStatus = getEffectiveBusinessStatus(post);
  const businessHoursText = getPromoBusinessHoursText(post);

  return (
    <div className="rounded-2xl border border-signature/20 bg-signature-light/40 px-4 py-4">
      <p className="text-sm font-bold text-stone-800">업체 정보</p>
      <dl className="mt-3 space-y-3 text-sm">
        {post.address && (
          <div>
            <dt className="text-xs font-semibold text-stone-500">주소</dt>
            <dd className="mt-1 leading-6 text-stone-700">{post.address}</dd>
            {mapQuery && (
              <a
                href={`https://map.naver.com/v5/search/${mapQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex text-xs font-semibold text-signature-dark hover:underline"
              >
                네이버 지도에서 보기 →
              </a>
            )}
          </div>
        )}
        {post.phone && (
          <div>
            <dt className="text-xs font-semibold text-stone-500">전화번호</dt>
            <dd className="mt-1">
              <a
                href={`tel:${post.phone.replace(/[^\d+]/g, "")}`}
                className="font-semibold text-signature-dark hover:underline"
              >
                {post.phone}
              </a>
            </dd>
          </div>
        )}
        {(businessHoursText || hasWeeklyOpenHours(post.businessWeeklyHours)) && (
          <div>
            <dt className="text-xs font-semibold text-stone-500">영업시간</dt>
            {businessHoursText && (
              <dd className="mt-1 leading-6 text-stone-700">{businessHoursText}</dd>
            )}
            {hasWeeklyOpenHours(post.businessWeeklyHours) && (
              <dd className={businessHoursText ? "mt-3" : "mt-1"}>
                <PromoWeeklyHoursPanel hours={post.businessWeeklyHours} />
              </dd>
            )}
          </div>
        )}
        {(post.businessStatus || businessStatus) && (
          <div>
            <dt className="text-xs font-semibold text-stone-500">영업 현황</dt>
            <dd className="mt-1">
              <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                {post.businessStatus ?? businessStatus}
              </span>
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
