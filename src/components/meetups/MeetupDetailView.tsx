"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import NaverNavButton from "@/components/routes/NaverNavButton";
import MeetupEditForm from "@/components/meetups/MeetupEditForm";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import {
  canJoinMeetup,
  canLeaveMeetup,
  canManageMeetup,
  formatMeetupDate,
  getMeetupDday,
  getMeetupParticipantCount,
  getMeetupStatusClass,
  getMeetupStatusLabel,
  isUserJoined,
  meetupPaceMeta,
  type MeetupEntry,
} from "@/lib/meetup";

type MeetupDetailViewProps = {
  initialEntry: MeetupEntry;
};

export default function MeetupDetailView({ initialEntry }: MeetupDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [entry, setEntry] = useState(initialEntry);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const dday = getMeetupDday(entry.meetupDate);
  const participantCount = getMeetupParticipantCount(entry);
  const joined = user ? isUserJoined(entry, user.id) : false;
  const joinable = user ? canJoinMeetup(entry, user.id) : false;
  const leavable = user ? canLeaveMeetup(entry, user.id) : false;
  const canManage = canManageMeetup(user, entry);

  useEffect(() => {
    setEntry(initialEntry);
  }, [initialEntry]);

  useEffect(() => {
    const viewKey = `meetup-view-${initialEntry.id}`;

    async function recordView() {
      try {
        let latest = initialEntry;

        if (!sessionStorage.getItem(viewKey)) {
          sessionStorage.setItem(viewKey, "1");
          const viewRes = await fetch(`/api/meetups/${initialEntry.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "view" }),
          });
          const viewData = await viewRes.json();
          if (viewRes.ok) {
            latest = viewData.entry as MeetupEntry;
          }
        }

        const detailRes = await fetch(`/api/meetups/${initialEntry.id}`);
        const detailData = await detailRes.json();
        if (detailRes.ok) {
          latest = detailData.entry as MeetupEntry;
        }

        setEntry(latest);
      } catch {
        setError("모임 정보를 불러오지 못했습니다.");
      }
    }

    void recordView();
  }, [initialEntry]);

  const handleJoin = async () => {
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const response = await fetch(`/api/meetups/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join" }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "참가 처리에 실패했습니다.");
      }

      setEntry(data.entry as MeetupEntry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "참가 처리에 실패했습니다.");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!user) return;

    setLeaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/meetups/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "참가 취소에 실패했습니다.");
      }

      setEntry(data.entry as MeetupEntry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "참가 취소에 실패했습니다.");
    } finally {
      setLeaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("이 모임을 삭제할까요?")) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/meetups/${entry.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "모임 삭제에 실패했습니다.");
      }

      router.push("/meetups");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "모임 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <article className="portal-panel overflow-hidden">
        <div className="border-b border-signature/10 bg-white px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {dday && (
                  <span className="rounded-full bg-signature px-2.5 py-1 text-[11px] font-bold text-white">
                    {dday}
                  </span>
                )}
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${getMeetupStatusClass(entry)}`}
                >
                  {getMeetupStatusLabel(entry)}
                </span>
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-semibold text-stone-600">
                  {entry.region}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${meetupPaceMeta[entry.pace].badgeClass}`}
                >
                  {meetupPaceMeta[entry.pace].label}
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-bold text-stone-800">
                {entry.title}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-stone-500">
                <AuthorWithGrade
                  author={entry.author}
                  nicknameClassName="text-sm text-stone-500"
                  className="inline-flex max-w-full flex-wrap items-center gap-1"
                />
                <span aria-hidden>·</span>
                <span>조회 {entry.views}</span>
              </p>
            </div>

            {canManage && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(true)}
                  className="rounded-full border border-signature/30 bg-white px-3 py-1 text-xs font-semibold text-signature-dark hover:bg-signature-light"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleting}
                  className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                >
                  {deleting ? "삭제 중..." : "삭제"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5 px-6 py-6 sm:px-8">
          <section className="rounded-2xl bg-signature-light/40 p-4">
            <p className="text-xs font-semibold text-signature-dark">일시</p>
            <p className="mt-1 text-lg font-bold text-stone-800">
              {formatMeetupDate(entry.meetupDate)}
            </p>
          </section>

          <section>
            <p className="text-sm font-semibold text-stone-700">모임 장소</p>
            <p className="mt-1 text-base text-stone-800">{entry.meetingPoint}</p>
            {entry.meetingDetail && (
              <p className="mt-2 text-sm text-stone-500">{entry.meetingDetail}</p>
            )}
            {entry.lat != null && entry.lng != null && (
              <div className="mt-3">
                <NaverNavButton
                  waypoints={[
                    { lat: entry.lat, lng: entry.lng, name: entry.meetingPoint },
                  ]}
                  compact
                />
              </div>
            )}
          </section>

          {entry.routeHint && (
            <section>
              <p className="text-sm font-semibold text-stone-700">코스 힌트</p>
              <p className="mt-1 text-sm text-stone-600">{entry.routeHint}</p>
            </section>
          )}

          <section>
            <p className="text-sm font-semibold text-stone-700">모임 소개</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-600">
              {entry.description}
            </p>
          </section>

          {entry.contact && (
            <section className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
              <p className="text-sm font-semibold text-stone-700">연락 수단</p>
              <p className="mt-1 text-sm text-stone-600">{entry.contact}</p>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-stone-700">
                참가자 ({participantCount}
                {entry.maxParticipants != null ? `/${entry.maxParticipants}` : ""})
              </p>
              {!user && (
                <p className="text-xs text-stone-400">로그인 후 참가할 수 있습니다.</p>
              )}
            </div>
            {entry.participants.length === 0 ? (
              <p className="mt-2 text-sm text-stone-400">아직 참가자가 없습니다.</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {entry.participants.map((participant) => (
                  <li
                    key={participant.userId}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 ring-1 ring-stone-200"
                  >
                    {participant.nickname}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
            {!user && (
              <Link
                href={`/login?next=${encodeURIComponent(pathname || `/meetups/${entry.id}`)}`}
                className="portal-btn px-4 py-2 text-sm"
              >
                로그인 후 참가하기
              </Link>
            )}

            {user && joinable && (
              <button
                type="button"
                onClick={() => void handleJoin()}
                disabled={joining}
                className="portal-btn px-4 py-2 text-sm disabled:opacity-60"
              >
                {joining ? "신청 중..." : "참가 신청"}
              </button>
            )}
            {user && joined && leavable && (
              <button
                type="button"
                onClick={() => void handleLeave()}
                disabled={leaving}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
              >
                {leaving ? "취소 중..." : "참가 취소"}
              </button>
            )}
            {user && joined && !leavable && (
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                참가 완료
              </span>
            )}
          </div>
        </div>
      </article>

      {showEdit && (
        <MeetupEditForm
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

