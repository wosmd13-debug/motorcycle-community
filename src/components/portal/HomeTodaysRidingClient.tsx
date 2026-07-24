"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLoginRedirect } from "@/components/auth/useLoginRedirect";
import {
  canJoinMeetup,
  formatMeetupDate,
  getMeetupDday,
  isUserJoined,
  type MeetupEntry,
} from "@/lib/meetup";
import { getMeetupRemainingSeats } from "@/lib/home-action";

type HomeTodaysRidingClientProps = {
  initialEntries: MeetupEntry[];
};

function seatsLabel(entry: MeetupEntry): string {
  const remaining = getMeetupRemainingSeats(entry);
  if (remaining == null) {
    return `${entry.participants.length}명 참여 중`;
  }
  if (remaining === 0) return "잔여 0석 · 마감";
  return `남은 자리 ${remaining}석 · ${entry.participants.length}/${entry.maxParticipants}`;
}

export default function HomeTodaysRidingClient({
  initialEntries,
}: HomeTodaysRidingClientProps) {
  const { user } = useAuth();
  const ensureLoggedIn = useLoginRedirect();
  const [entries, setEntries] = useState(initialEntries);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (id: string) => {
    if (!ensureLoggedIn()) return;

    setError(null);
    setJoiningId(id);
    try {
      const response = await fetch(`/api/meetups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join" }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "참가 처리에 실패했습니다.");
      }
      const updated = data.entry as MeetupEntry;
      setEntries((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "참가 처리에 실패했습니다.");
    } finally {
      setJoiningId(null);
    }
  };

  if (entries.length === 0) {
    return (
      <div className="home-empty-state">
        <p className="home-empty-state-title">
          다가오는 라이딩 모집이 아직 없어요
        </p>
        <p className="home-empty-state-copy">
          이번 주말 모임을 만들어 함께 달려 보세요.
        </p>
        <Link href="/meetups" className="home-hero-cta home-hero-cta-primary">
          모집 등록하기
        </Link>
      </div>
    );
  }

  return (
    <div className="home-riding-list">
      {error && (
        <p className="home-action-error" role="alert">
          {error}
        </p>
      )}
      {entries.map((entry) => {
        const dday = getMeetupDday(entry.meetupDate);
        const joined = user ? isUserJoined(entry, user.id) : false;
        const joinable = user ? canJoinMeetup(entry, user.id) : true;
        const joining = joiningId === entry.id;

        return (
          <article key={entry.id} className="home-riding-item">
            <div className="home-riding-body min-w-0">
              <div className="home-riding-meta">
                <time dateTime={entry.meetupDate}>
                  {formatMeetupDate(entry.meetupDate)}
                </time>
                {dday && <span className="home-riding-dday">{dday}</span>}
                <span className="home-post-card-cat">{entry.region}</span>
              </div>
              <Link href={`/meetups/${entry.id}`} className="home-riding-title">
                {entry.title}
              </Link>
              <p className="home-riding-point">{entry.meetingPoint}</p>
              <p className="home-riding-seats">{seatsLabel(entry)}</p>
            </div>

            <div className="home-riding-actions shrink-0">
              {!user && (
                <Link
                  href={`/login?next=${encodeURIComponent(`/meetups/${entry.id}`)}`}
                  className="home-action-btn home-action-btn-primary"
                >
                  참여하기
                </Link>
              )}
              {user && joinable && (
                <button
                  type="button"
                  className="home-action-btn home-action-btn-primary"
                  disabled={joining}
                  onClick={() => void handleJoin(entry.id)}
                >
                  {joining ? "신청 중…" : "참여하기"}
                </button>
              )}
              {user && joined && (
                <Link
                  href={`/meetups/${entry.id}`}
                  className="home-action-btn home-action-btn-done"
                >
                  참여 완료
                </Link>
              )}
              {user && !joinable && !joined && (
                <Link
                  href={`/meetups/${entry.id}`}
                  className="home-action-btn home-action-btn-muted"
                >
                  상세 보기
                </Link>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
