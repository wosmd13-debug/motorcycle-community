"use client";

import Link from "next/link";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import {
  formatMeetupDateShort,
  getMeetupDday,
  getMeetupParticipantCount,
  getMeetupStatusClass,
  getMeetupStatusLabel,
  meetupPaceMeta,
  type MeetupEntry,
} from "@/lib/meetup";

type MeetupCardProps = {
  entry: MeetupEntry;
};

export default function MeetupCard({ entry }: MeetupCardProps) {
  const dday = getMeetupDday(entry.meetupDate);
  const participantCount = getMeetupParticipantCount(entry);
  const capacityLabel =
    entry.maxParticipants != null
      ? `${participantCount}/${entry.maxParticipants}명`
      : `${participantCount}명 참가`;

  return (
    <article className="overflow-hidden rounded-3xl border border-signature/20 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <Link href={`/meetups/${entry.id}`} className="block w-full text-left">
        <div className="border-b border-signature/10 bg-gradient-to-r from-signature-light/80 to-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-signature-dark">
                {formatMeetupDateShort(entry.meetupDate)}
              </p>
              <h2 className="mt-1 line-clamp-2 text-lg font-bold text-stone-800">
                {entry.title}
              </h2>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
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
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
              {entry.region}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${meetupPaceMeta[entry.pace].badgeClass}`}
            >
              {meetupPaceMeta[entry.pace].label}
            </span>
            {entry.routeHint && (
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-100">
                {entry.routeHint}
              </span>
            )}
          </div>

          <p className="mt-3 text-sm font-medium text-stone-700">
            📍 {entry.meetingPoint}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-stone-500">
            {entry.description}
          </p>

          <div className="mt-4 flex items-end justify-between gap-3 text-sm">
            <div>
              <p className="font-semibold text-stone-700">{capacityLabel}</p>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-stone-400">
                <AuthorWithGrade
                  author={entry.author}
                  nicknameClassName="text-xs text-stone-400"
                  className="inline-flex max-w-full flex-wrap items-center gap-1"
                />
                <span aria-hidden>·</span>
                <span>조회 {entry.views}</span>
              </p>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
