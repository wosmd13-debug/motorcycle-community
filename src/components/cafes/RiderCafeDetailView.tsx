"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import RiderCafeEditForm from "@/components/cafes/RiderCafeEditForm";
import EngagementLikeButton from "@/components/engagement/EngagementLikeButton";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import { fetchEngagementAction } from "@/lib/engagement-client";
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

type RiderCafeDetailViewProps = {
  initialEntry: RiderCafeEntry;
};

export default function RiderCafeDetailView({
  initialEntry,
}: RiderCafeDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [entry, setEntry] = useState(initialEntry);
  const [error, setError] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const canManage = user ? canManageRiderCafe(user, entry) : false;

  const mapQuery = encodeURIComponent(entry.address);
  const phoneHref = entry.phone?.replace(/[^\d+]/g, "");
  const todayHours = formatTodayOpenHours(entry.weeklyHours);

  useEffect(() => {
    setEntry(initialEntry);
  }, [initialEntry]);

  useEffect(() => {
    const viewKey = `rider-cafe-view-${initialEntry.id}`;

    async function recordView() {
      try {
        let latest = initialEntry;

        if (!sessionStorage.getItem(viewKey)) {
          sessionStorage.setItem(viewKey, "1");
          const viewRes = await fetch(`/api/rider-cafes/${initialEntry.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "view" }),
          });
          const viewData = await viewRes.json();
          if (viewRes.ok) {
            latest = viewData.entry as RiderCafeEntry;
          }
        }

        const detailRes = await fetch(`/api/rider-cafes/${initialEntry.id}`);
        const detailData = await detailRes.json();
        if (detailRes.ok) {
          latest = detailData.entry as RiderCafeEntry;
        }

        setEntry(latest);
      } catch {
        setError("카페 정보를 불러오지 못했습니다.");
      }
    }

    void recordView();
  }, [initialEntry]);

  const handleLike = async () => {
    setLiking(true);
    setError(null);

    try {
      const response = await fetchEngagementAction(
        `/api/rider-cafes/${entry.id}`,
        { action: "like" }
      );
      const data = await response.json();

      if (response.status === 401) return;
      if (!response.ok) {
        throw new Error(data.error ?? "추천 처리에 실패했습니다.");
      }

      setEntry(data.entry as RiderCafeEntry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "추천 처리에 실패했습니다.");
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`"${entry.name}" 카페 정보를 삭제할까요?`)) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/rider-cafes/${entry.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "카페 정보 삭제에 실패했습니다.");
      }

      router.push("/cafes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "카페 정보 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <article className="portal-panel overflow-hidden">
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

        <div className="space-y-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-flex rounded-full bg-signature-light px-2.5 py-0.5 text-xs font-semibold text-signature-dark">
                ☕ {entry.region}
              </span>
              <h1 className="mt-2 text-2xl font-bold text-slate-800">
                {entry.name}
              </h1>
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
            <div className="flex flex-wrap items-center justify-end gap-2">
              {canManage && (
                <div className="flex flex-wrap items-center gap-2">
                  {user?.isOperator && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                      운영자
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowEdit(true)}
                    className="rounded-full border border-signature/30 bg-white px-3 py-1.5 text-sm font-semibold text-signature-dark hover:bg-signature-light"
                  >
                    정보 수정
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    {deleting ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-signature-light/70 px-4 py-4">
            <p className="text-xs font-semibold text-signature-darker">주소</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              {entry.address}
            </p>
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
            <div className="w-fit max-w-xs rounded-2xl border border-signature/20 bg-white px-4 py-3">
              <p className="text-sm font-semibold text-stone-800">
                요일별 영업시간
              </p>
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
            <div className="grid gap-3 sm:grid-cols-2">
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
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-semibold text-slate-800">🛣️ 오는 길</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                {entry.directions}
              </p>
            </div>
          )}

          {entry.description && (
            <p className="text-sm leading-7 text-slate-600">{entry.description}</p>
          )}

          {entry.amenities && entry.amenities.length > 0 && (
            <div>
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

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-signature/10 pt-5">
            <EngagementLikeButton
              likes={entry.likes}
              liking={liking}
              onLike={() => void handleLike()}
              label="❤️ 추천"
              className="portal-btn px-4 py-2 text-sm disabled:opacity-60"
            />
            <span className="text-sm text-slate-500">👁 {entry.views}회 조회</span>
          </div>
        </div>
      </article>

      {showEdit && (
        <RiderCafeEditForm
          entry={entry}
          onClose={() => setShowEdit(false)}
          onUpdated={(updated) => {
            setEntry(updated);
            setShowEdit(false);
            router.refresh();
          }}
        />
      )}
    </>
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

