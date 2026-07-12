"use client";

import PortalModal from "@/components/portal/PortalModal";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import NaverNavButton from "@/components/routes/NaverNavButton";
import {
  canJoinMeetup,
  canLeaveMeetup,
  formatMeetupDate,
  getMeetupDday,
  getMeetupParticipantCount,
  getMeetupStatusClass,
  getMeetupStatusLabel,
  isUserJoined,
  meetupPaceMeta,
  type MeetupEntry,
} from "@/lib/meetup";

type MeetupDetailModalProps = {
  entry: MeetupEntry;
  onClose: () => void;
  onJoin: (id: string) => Promise<void>;
  onLeave: (id: string) => Promise<void>;
  joining?: boolean;
  leaving?: boolean;
  canManage?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
};

export default function MeetupDetailModal({
  entry,
  onClose,
  onJoin,
  onLeave,
  joining = false,
  leaving = false,
  canManage = false,
  onEdit,
  onDelete,
  deleting = false,
}: MeetupDetailModalProps) {
  const { user } = useAuth();
  const [actionError, setActionError] = useState<string | null>(null);

  const dday = getMeetupDday(entry.meetupDate);
  const participantCount = getMeetupParticipantCount(entry);
  const joined = user ? isUserJoined(entry, user.id) : false;
  const joinable = user ? canJoinMeetup(entry, user.id) : false;
  const leavable = user ? canLeaveMeetup(entry, user.id) : false;

  const handleJoin = async () => {
    setActionError(null);
    try {
      await onJoin(entry.id);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "참가 신청에 실패했습니다."
      );
    }
  };

  const handleLeave = async () => {
    setActionError(null);
    try {
      await onLeave(entry.id);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "참가 취소에 실패했습니다."
      );
    }
  };

  return (
    <PortalModal onClose={onClose}>
      <div className="portal-modal-panel max-w-2xl overflow-y-auto shadow-2xl">
        <div className="portal-modal-header">
          <div className="min-w-0 flex-1">
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
              <h2 className="mt-3 text-xl font-bold text-stone-800">{entry.title}</h2>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-500">
                <AuthorWithGrade
                  author={entry.author}
                  nicknameClassName="text-sm text-stone-500"
                  className="inline-flex max-w-full flex-wrap items-center gap-1"
                />
                <span aria-hidden>·</span>
                <span>조회 {entry.views}</span>
              </p>
            </div>
            <div className="portal-modal-header-actions">
              {canManage && onEdit && onDelete && (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onEdit}
                    className="rounded-full border border-signature/30 bg-white px-3 py-1 text-xs font-semibold text-signature-dark hover:bg-signature-light"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={deleting}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    {deleting ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                닫기
              </button>
            </div>
        </div>

        <div className="space-y-5 px-6 py-5">
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

          {actionError && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {actionError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
            {joinable && (
              <button
                type="button"
                onClick={handleJoin}
                disabled={joining}
                className="portal-btn px-4 py-2 text-sm disabled:opacity-60"
              >
                {joining ? "신청 중..." : "참가 신청"}
              </button>
            )}
            {joined && leavable && (
              <button
                type="button"
                onClick={handleLeave}
                disabled={leaving}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
              >
                {leaving ? "취소 중..." : "참가 취소"}
              </button>
            )}
            {joined && !leavable && (
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                참가 완료
              </span>
            )}
          </div>
        </div>
      </div>
    </PortalModal>
  );
}
