"use client";

import PortalModal from "@/components/portal/PortalModal";

import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import EngagementLikeButton from "@/components/engagement/EngagementLikeButton";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import {
  WEEK_DAYS,
  WEEK_DAY_LABELS,
  formatDayOpenHours,
} from "@/lib/rider-cafe-hours";
import {
  canManageRiderCafe,
  formatRiderCafeDate,
  formatTodayOpenHours,
  hasBusinessInfo,
  type RiderCafeEntry,
} from "@/lib/rider-cafe";

type RiderCafeDetailModalProps = {
  entry: RiderCafeEntry;
  onClose: () => void;
  onLike: (id: string) => void;
  onEdit: (entry: RiderCafeEntry) => void;
  onDelete?: (entry: RiderCafeEntry) => void;
  liking?: boolean;
  deleting?: boolean;
};

export default function RiderCafeDetailModal({
  entry,
  onClose,
  onLike,
  onEdit,
  onDelete,
  liking = false,
  deleting = false,
}: RiderCafeDetailModalProps) {
  const { user } = useAuth();
  const canManage = user ? canManageRiderCafe(user, entry) : false;
  const mapQuery = encodeURIComponent(entry.address);
  const phoneHref = entry.phone?.replace(/[^\d+]/g, "");
  const todayHours = formatTodayOpenHours(entry.weeklyHours);

  return (
    <PortalModal onClose={onClose}>
      <div
        className="portal-modal-panel max-w-3xl overflow-y-auto shadow-2xl"
      >
        <div className="relative flex min-h-[280px] w-full items-center justify-center bg-signature-light/30 p-4 sm:min-h-[420px]">
          <Image
            src={entry.imageUrl}
            alt={entry.name}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-flex rounded-full bg-signature-light px-2.5 py-0.5 text-xs font-semibold text-signature-dark">
                ☕ {entry.region}
              </span>
              <h2 className="mt-2 text-2xl font-bold text-slate-800">{entry.name}</h2>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span>등록:</span>
                <AuthorWithGrade
                  author={entry.author}
                  nicknameClassName="text-sm text-slate-500"
                  className="inline-flex max-w-full flex-wrap items-center gap-1"
                />
                <span aria-hidden>·</span>
                <span>{formatRiderCafeDate(entry.createdAt)}</span>
              </p>
              {todayHours && (
                <p className="mt-2 text-sm font-semibold text-signature-dark">
                  🕐 {todayHours}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {canManage && (
                <>
                  {user?.isOperator && (
                    <span className="self-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                      운영자
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onEdit(entry)}
                    className="rounded-full border border-signature/30 bg-white px-3 py-1.5 text-sm font-semibold text-signature-dark hover:bg-signature-light"
                  >
                    정보 수정
                  </button>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(entry)}
                      disabled={deleting}
                      className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                    >
                      {deleting ? "삭제 중..." : "삭제"}
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                닫기
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-signature-light/70 px-4 py-4">
            <p className="text-xs font-semibold text-signature-darker">주소</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{entry.address}</p>
            <a
              href={`https://map.naver.com/v5/search/${mapQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-sm font-semibold text-signature-dark hover:underline"
            >
              네이버 지도에서 보기 →
            </a>
          </div>

          {entry.weeklyHours && (
            <div className="mt-5 w-fit max-w-xs rounded-2xl border border-signature/20 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-stone-800">요일별 영업시간</p>
              <div className="mt-2 divide-y divide-signature-light">
                {WEEK_DAYS.map((day) => (
                  <div
                    key={day}
                    className="grid grid-cols-[1.25rem_auto] items-center gap-x-4 py-1.5 text-sm"
                  >
                    <span className="font-semibold text-slate-700">
                      {WEEK_DAY_LABELS[day]}
                    </span>
                    <span
                      className={
                        entry.weeklyHours![day].closed
                          ? "font-medium text-slate-400"
                          : "text-slate-700"
                      }
                    >
                      {formatDayOpenHours(entry.weeklyHours![day])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasBusinessInfo(entry) && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {entry.phone && (
                <InfoCard label="전화번호">
                  <a
                    href={`tel:${phoneHref}`}
                    className="font-semibold text-signature-dark hover:underline"
                  >
                    {entry.phone}
                  </a>
                </InfoCard>
              )}
              {entry.closedDays && (
                <InfoCard label="임시 휴무 / 공휴일">{entry.closedDays}</InfoCard>
              )}
              {entry.website && (
                <InfoCard label="웹사이트 / SNS">
                  <a
                    href={
                      entry.website.startsWith("http")
                        ? entry.website
                        : `https://${entry.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all font-semibold text-signature-dark hover:underline"
                  >
                    {entry.website}
                  </a>
                </InfoCard>
              )}
            </div>
          )}

          {entry.directions && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-semibold text-slate-800">🛣️ 오는 길</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                {entry.directions}
              </p>
            </div>
          )}

          {entry.description && (
            <p className="mt-5 text-sm leading-7 text-slate-600">{entry.description}</p>
          )}

          {entry.amenities && entry.amenities.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-700">편의시설</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {entry.amenities.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-signature-light px-3 py-1 text-xs font-medium text-signature-darker ring-1 ring-signature/20"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-signature/10 pt-5">
            <EngagementLikeButton
              likes={entry.likes}
              liking={liking}
              onLike={() => onLike(entry.id)}
              label="❤️ 추천"
              className="portal-btn px-4 py-2 text-sm disabled:opacity-60"
            />
            <span className="text-sm text-slate-500">👁 {entry.views}회 조회</span>
          </div>
        </div>
      </div>
    </PortalModal>
  );
}

function InfoCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-signature/20 bg-white px-4 py-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-800">{children}</p>
    </div>
  );
}
