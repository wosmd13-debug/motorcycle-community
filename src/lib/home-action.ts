import type { GalleryPost } from "@/lib/gallery";
import {
  isMeetupFull,
  isMeetupPast,
  type MeetupEntry,
} from "@/lib/meetup";

export type HomeRidingCard = {
  id: string;
  title: string;
  href: string;
  region: string;
  meetupDate: string;
  meetingPoint: string;
  participantCount: number;
  maxParticipants: number | null;
  /** null = 정원 없음(무제한) */
  remainingSeats: number | null;
};

export type HomeTodaysBikeCard = {
  id: string;
  title: string;
  href: string;
  imageUrl: string;
  blurb: string;
  author: string;
};

export function getMeetupRemainingSeats(entry: MeetupEntry): number | null {
  if (entry.maxParticipants == null) return null;
  return Math.max(0, entry.maxParticipants - entry.participants.length);
}

/**
 * Content Spec: upcoming + recruiting only (past / cancelled / full hidden).
 * Sort by soonest meetupDate. Max `limit` (default 5).
 */
export function pickTodaysRidingMeetups(
  entries: MeetupEntry[],
  limit = 5,
  now = new Date()
): HomeRidingCard[] {
  return entries
    .filter(
      (entry) =>
        !entry.cancelled &&
        !isMeetupPast(entry, now) &&
        !isMeetupFull(entry)
    )
    .sort(
      (a, b) =>
        new Date(a.meetupDate).getTime() - new Date(b.meetupDate).getTime()
    )
    .slice(0, limit)
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      href: `/meetups/${entry.id}`,
      region: entry.region,
      meetupDate: entry.meetupDate,
      meetingPoint: entry.meetingPoint,
      participantCount: entry.participants.length,
      maxParticipants: entry.maxParticipants ?? null,
      remainingSeats: getMeetupRemainingSeats(entry),
    }));
}

function daySeedIndex(length: number): number {
  if (length <= 0) return 0;
  const day = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  return day % length;
}

/**
 * Today's Bike: prefer gallery category "바이크" with photo.
 * Recommend = top engagement pool, day-stable pick (not raw Math.random).
 */
export function pickTodaysBike(
  posts: GalleryPost[]
): HomeTodaysBikeCard | null {
  const withImage = posts.filter((p) => Boolean(p.imageUrl?.trim()));
  const bikes = withImage.filter((p) => p.category === "바이크");
  const pool = bikes.length > 0 ? bikes : withImage;
  if (pool.length === 0) return null;

  const ranked = [...pool].sort(
    (a, b) => b.likes + b.views - (a.likes + a.views)
  );
  const shortlist = ranked.slice(0, Math.min(8, ranked.length));
  const picked = shortlist[daySeedIndex(shortlist.length)];
  if (!picked) return null;

  const blurb =
    (picked.caption?.trim() || picked.title.trim() || "바이크 후기를 확인해 보세요.").slice(
      0,
      80
    );

  return {
    id: picked.id,
    title: picked.title,
    href: `/gallery/${picked.id}`,
    imageUrl: picked.imageUrl,
    blurb,
    author: picked.author,
  };
}
