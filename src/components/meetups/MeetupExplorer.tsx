"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLoginRedirect } from "@/components/auth/useLoginRedirect";
import MeetupCard from "@/components/meetups/MeetupCard";
import MeetupEditForm from "@/components/meetups/MeetupEditForm";
import MeetupWriteForm from "@/components/meetups/MeetupWriteForm";
import {
  canManageMeetup,
  filterMeetups,
  meetupRegions,
  meetupScheduleFilters,
  type MeetupEntry,
  type MeetupScheduleFilter,
} from "@/lib/meetup";

type MeetupExplorerProps = {
  initialEntries: MeetupEntry[];
  initialQuery?: string;
};

export default function MeetupExplorer({
  initialEntries,
  initialQuery = "",
}: MeetupExplorerProps) {
  const ensureLoggedIn = useLoginRedirect();
  const { user } = useAuth();
  const [entries, setEntries] = useState<MeetupEntry[]>(initialEntries);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<(typeof meetupRegions)[number]>("전체");
  const [schedule, setSchedule] = useState<MeetupScheduleFilter>("upcoming");
  const [query, setQuery] = useState(initialQuery);
  const [editingEntry, setEditingEntry] = useState<MeetupEntry | null>(null);
  const [showWrite, setShowWrite] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredEntries = useMemo(
    () => filterMeetups({ entries, region, schedule, query }),
    [entries, region, schedule, query]
  );

  const updateEntry = (updated: MeetupEntry) => {
    setEntries((current) =>
      current.map((entry) => (entry.id === updated.id ? updated : entry))
    );
  };

  const handleJoin = async (id: string) => {
    if (!ensureLoggedIn()) {
      throw new Error("로그인이 필요합니다.");
    }

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

      updateEntry(data.entry as MeetupEntry);
    } finally {
      setJoiningId(null);
    }
  };

  const handleLeave = async (id: string) => {
    setLeavingId(id);

    try {
      const response = await fetch(`/api/meetups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "참가 취소에 실패했습니다.");
      }

      updateEntry(data.entry as MeetupEntry);
    } finally {
      setLeavingId(null);
    }
  };

  const handleCreated = (entry: MeetupEntry) => {
    setEntries((current) => [entry, ...current]);
  };

  const handleUpdated = (entry: MeetupEntry) => {
    updateEntry(entry);
  };

  const handleDelete = async (entry: MeetupEntry) => {
    if (!window.confirm("이 모임을 삭제할까요?")) return;

    setDeletingId(entry.id);

    try {
      const response = await fetch(`/api/meetups/${entry.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "모임 삭제에 실패했습니다.");
      }

      setEntries((current) => current.filter((item) => item.id !== entry.id));
      setEditingEntry(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "모임 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="portal-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">라이딩 모임 탐색</p>
            <p className="mt-1 text-xs text-slate-500">
              총 {filteredEntries.length}건 · 예정 모임을 확인하고 참가하세요
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (ensureLoggedIn()) setShowWrite(true);
            }}
            className="portal-btn px-4 py-2 text-sm"
          >
            + 모임 등록
          </button>
        </div>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="제목, 집합 장소, 코스, 지역 검색..."
          className="mt-4 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {meetupScheduleFilters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSchedule(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                schedule === item.id
                  ? "bg-signature text-white shadow-sm"
                  : "bg-signature-light/60 text-stone-600 ring-1 ring-signature/20 hover:bg-signature-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {meetupRegions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRegion(item)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                region === item
                  ? "bg-slate-800 text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-portal-border hover:bg-portal-muted"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {error && entries.length === 0 ? (
        <div className="portal-panel border-dashed px-6 py-12 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="portal-panel border-dashed px-6 py-16 text-center">
          <p className="font-semibold text-slate-700">
            조건에 맞는 라이딩 모임이 없습니다
          </p>
          <button
            type="button"
            onClick={() => {
              if (ensureLoggedIn()) setShowWrite(true);
            }}
            className="portal-btn mt-4 px-4 py-2 text-sm"
          >
            첫 모임 등록하기
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEntries.map((entry) => (
            <MeetupCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {error && entries.length > 0 && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {editingEntry && (
        <MeetupEditForm
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onUpdated={(entry) => {
            handleUpdated(entry);
            setEditingEntry(null);
          }}
        />
      )}

      {showWrite && (
        <MeetupWriteForm
          onClose={() => setShowWrite(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
