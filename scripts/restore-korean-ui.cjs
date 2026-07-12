const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function write(rel, content) {
  const file = path.join(root, rel);
  fs.writeFileSync(file, content, "utf8");
  console.log("wrote", rel);
}

write(
  "src/components/meetups/MeetupWriteForm.tsx",
  `"use client";

import { useState } from "react";
import {
  meetupPaces,
  meetupRegions,
  type MeetupEntry,
  type MeetupPace,
  type MeetupRegion,
} from "@/lib/meetup";

type MeetupWriteFormProps = {
  onClose: () => void;
  onCreated: (entry: MeetupEntry) => void;
};

export default function MeetupWriteForm({
  onClose,
  onCreated,
}: MeetupWriteFormProps) {
  const [title, setTitle] = useState("");
  const [region, setRegion] = useState<MeetupRegion>(meetupRegions[1]);
  const [meetupDate, setMeetupDate] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [meetingDetail, setMeetingDetail] = useState("");
  const [pace, setPace] = useState<MeetupPace>(meetupPaces[1]);
  const [routeHint, setRouteHint] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
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
      const response = await fetch("/api/meetups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "라이딩 모임 등록에 실패했습니다.");
      }

      onCreated(data.entry as MeetupEntry);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "라이딩 모임 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="portal-modal-overlay">
      <form
        onSubmit={handleSubmit}
        className="portal-modal-panel max-w-2xl overflow-y-auto p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-stone-800">라이딩 모임 개설</h2>
            <p className="mt-1 text-sm text-stone-500">
              일정, 지역, 페이스, 모임 장소 등을 입력하세요.
            </p>
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
          <Field label="모임 제목" required>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="예: 주말 강원도 라이딩"
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
              placeholder="예: 강릉역 앞 주차장"
              className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
              required
            />
          </Field>

          <Field label="장소 상세 / 추가 설명">
            <input
              value={meetingDetail}
              onChange={(event) => setMeetingDetail(event.target.value)}
              placeholder="예: 화장실 2층 편의점 옆"
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
              placeholder="예: 설악산 일주, 정선 다운"
              className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
            />
          </Field>

          <Field label="모임 소개" required>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              placeholder="준비물, 집결 시간, 주의사항 등을 적어주세요."
              className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
              required
            />
          </Field>

          <Field label="연락 수단">
            <input
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="예: 카카오 오픈채팅 (비공개 시 생략)"
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
            {submitting ? "등록 중..." : "모임 등록"}
          </button>
        </div>
      </form>
    </div>
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
`
);

write(
  "src/components/meetups/MeetupEditForm.tsx",
  `"use client";

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
      const response = await fetch(\`/api/meetups/\${entry.id}\`, {
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
    <div className="portal-modal-overlay z-[60]">
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
    </div>
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
`
);

function patchFile(rel, replacements) {
  const file = path.join(root, rel);
  let text = fs.readFileSync(file, "utf8");
  for (const [from, to] of replacements) {
    if (!text.includes(from)) {
      console.warn("skip (not found):", rel, JSON.stringify(from.slice(0, 40)));
      continue;
    }
    text = text.split(from).join(to);
  }
  fs.writeFileSync(file, text, "utf8");
  console.log("patched", rel);
}

patchFile("src/components/meetups/MeetupDetailModal.tsx", [
  ['err instanceof Error ? err.message : "?? ??? ??????."', 'err instanceof Error ? err.message : "참가 신청에 실패했습니다."'],
  ['{entry.author} ? ?? {entry.views}', '{entry.author} · 조회 {entry.views}'],
  [">??<", ">수정<"],
  ['{deleting ? "?? ?..." : "??"}', '{deleting ? "삭제 중..." : "삭제"}'],
  [">??<", ">닫기<"],
  ['<p className="text-xs font-semibold text-signature-dark">??</p>', '<p className="text-xs font-semibold text-signature-dark">일시</p>'],
  ['<p className="text-sm font-semibold text-stone-700">?? ??</p>', '<p className="text-sm font-semibold text-stone-700">모임 장소</p>'],
  ['<p className="text-sm font-semibold text-stone-700">?????</p>', '<p className="text-sm font-semibold text-stone-700">코스 힌트</p>'],
  ['<p className="text-sm font-semibold text-stone-700">?? ??</p>', '<p className="text-sm font-semibold text-stone-700">모임 소개</p>'],
  ['<p className="text-sm font-semibold text-stone-700">연락 수단</p>', '<p className="text-sm font-semibold text-stone-700">연락 수단</p>'],
  ['??? ({participantCount}', '참가자 ({participantCount}'],
  ['<p className="text-xs text-stone-400">????? ???? ?????.</p>', '<p className="text-xs text-stone-400">로그인 후 참가할 수 있습니다.</p>'],
  ['<p className="mt-2 text-sm text-stone-400">?? ???? ????.</p>', '<p className="mt-2 text-sm text-stone-400">아직 참가자가 없습니다.</p>'],
  ['{joining ? "?? ?..." : "?? ??"}', '{joining ? "신청 중..." : "참가 신청"}'],
  ['{leaving ? "?? ?..." : "?? ??"}', '{leaving ? "취소 중..." : "참가 취소"}'],
  ['?? ??', '참가 완료'],
]);

patchFile("src/components/marketplace/MarketplaceWriteForm.tsx", [
  ['throw new Error(uploadJson.error ?? "̹ ε忡 ߽ϴ.");', 'throw new Error(uploadJson.error ?? "이미지 업로드에 실패했습니다.");'],
  ['throw new Error(data.error ?? "Ź Ͽ ߽ϴ.");', 'throw new Error(data.error ?? "매물 등록에 실패했습니다.");'],
]);

patchFile("src/components/marketplace/MarketplaceEditForm.tsx", [
  ['throw new Error(uploadJson.error ?? "̹ ε忡 ߽ϴ.");', 'throw new Error(uploadJson.error ?? "이미지 업로드에 실패했습니다.");'],
  ['throw new Error(data.error ?? "Ź  ߽ϴ.");', 'throw new Error(data.error ?? "매물 수정에 실패했습니다.");'],
]);

patchFile("src/components/gallery/GalleryEditForm.tsx", [
  ['throw new Error(uploadJson.error ?? "̹ ε忡 ߽ϴ.");', 'throw new Error(uploadJson.error ?? "이미지 업로드에 실패했습니다.");'],
  ['throw new Error(data.error ?? "Խù  ߽ϴ.");', 'throw new Error(data.error ?? "게시물 수정에 실패했습니다.");'],
]);

console.log("done");
