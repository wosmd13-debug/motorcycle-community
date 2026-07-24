import Link from "next/link";
import HomeTodaysRidingClient from "@/components/portal/HomeTodaysRidingClient";
import { pickTodaysRidingMeetups } from "@/lib/home-action";
import { readMeetups } from "@/lib/meetup-store";

export default async function HomeTodaysRiding() {
  const entries = await readMeetups();
  const open = pickTodaysRidingMeetups(entries, 5);
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const initialEntries = open
    .map((item) => byId.get(item.id))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return (
    <section
      id="todays-riding"
      className="portal-panel home-reveal overflow-hidden"
    >
      <div className="portal-panel-head">
        <div className="flex items-center gap-2">
          <h2 className="portal-panel-title">오늘의 라이딩</h2>
          <span className="portal-badge">모집</span>
        </div>
        <Link href="/meetups" className="portal-panel-more">
          모집 전체
        </Link>
      </div>
      <HomeTodaysRidingClient initialEntries={initialEntries} />
    </section>
  );
}
