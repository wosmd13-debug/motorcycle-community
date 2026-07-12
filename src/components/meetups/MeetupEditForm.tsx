"use client";

import PortalModal from "@/components/portal/PortalModal";

import { useState } from "react";
import {
  meetupPaces,
  meetupRegions,
  toDatetimeLocalValue,
  type MeetupEntry,
  type MeetupPace,
  type MeetupRegion,
} from "@/lib/meetup";

type MeetupEditFormProps = {
  entry: MeetupEntry;
  onClose: () => void;
  onUpdated: (entry: MeetupEntry) => void;
};

export default function MeetupEditForm({
  entry,
  onClose,
  onUpdated,
}: MeetupEditFormProps) {
  const [title, setTitle] = useState(entry.title);
  const [region, setRegion] = useState<MeetupRegion>(entry.region);
  const [meetupDate, setMeetupDate] = useState(
    toDatetimeLocalValue(entry.meetupDate)
  );
  const [meetingPoint, setMeetingPoint] = useState(entry.meetingPoint);
  const [meetingDetail, setMeetingDetail] = useState(entry.meetingDetail ?? "");
  const [pace, setPace] = useState<MeetupPace>(entry.pace);
  const [routeHint, setRouteHint] = useState(entry.routeHint ?? "");
  const [description, setDescription] = useState(entry.description);
  const [contact, setContact] = useState(entry.contact ?? "");
  const [maxParticipants, setMaxParticipants] = useState(
    entry.maxParticipants != null ? String(entry.maxParticipants) : ""
  );
  const [cancelled, setCancelled] = useState(entry.cancelled);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postRegions = meetupRegions.filter(
    (item): item is MeetupRegion => item !== meetupRegions[0]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/meetups/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          title,
          region,
          meetupDate,
          meetingPoint,
          meetingDetail,
          pace,
          routeHint,
          description,
          contact,
          maxParticipants: maxParticipants || null,
          cancelled,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "라이딩 모임 수정에 실패했습니다.");
      }

      onUpdated(data.entry as MeetupEntry);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "라이딩 모임 수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortalModal onClose={onClose} overlayClassName="z-[80]">
      <form
        onSubmit={handleSubmit}
        className="portal-modal-panel max-w-2xl overflow-y-auto p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-stone-800">모임 수정</h2>
            <p className="mt-1 text-sm text-stone-500">{entry.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600"
          >
            닫기
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <input
              type="checkbox"
              checked={cancelled}
              onChange={(event) => setCancelled(event.target.checked)}
            />
            모임 취소 (참가자에게 취소 표시)
          </label>

          <Field label="모임 제목" required>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="지역" required>
              <select
                value={region}
                onChange={(event) => setRegion(event.target.value as MeetupRegion)}
                className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
              >
                {postRegions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="모임 일시" required>
              <input
                type="datetime-local"
                value={meetupDate}
                onChange={(event) => setMeetupDate(event.target.value)}
                className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
                required
              />
            </Field>
          </div>

          <Field label="모임 장소" required>
            <input
              value={meetingPoint}
              onChange={(event) => setMeetingPoint(event.target.value)}
              className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
              required
            />
          </Field>

          <Field label="장소 상세 / 추가 설명">
            <input
              value={meetingDetail}
              onChange={(event) => setMeetingDetail(event.target.value)}
              className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="페이스" required>
              <select
                value={pace}
                onChange={(event) => setPace(event.target.value as MeetupPace)}
                className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
              >
                {meetupPaces.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="최대 인원">
              <input
                type="number"
                min={1}
                max={999}
                value={maxParticipants}
                onChange={(event) => setMaxParticipants(event.target.value)}
                placeholder="미정이면 비워두기"
                className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
              />
            </Field>
          </div>

          <Field label="코스 힌트">
            <input
              value={routeHint}
              onChange={(event) => setRouteHint(event.target.value)}
              className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
            />
          </Field>

          <Field label="모임 소개" required>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
              required
            />
          </Field>

          <Field label="연락 수단">
            <input
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
            />
          </Field>
        </div>

        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="portal-btn flex-1 py-2.5 text-sm disabled:opacity-60"
          >
            {submitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </PortalModal>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-stone-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
