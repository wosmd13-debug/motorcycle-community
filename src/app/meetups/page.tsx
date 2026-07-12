import PageHeader from "@/components/PageHeader";
import MeetupExplorer from "@/components/meetups/MeetupExplorer";
import { readMeetups } from "@/lib/meetup-store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type MeetupsPageProps = {
  searchParams: Promise<{ q?: string; id?: string }>;
};

export default async function MeetupsPage({ searchParams }: MeetupsPageProps) {
  const { q, id } = await searchParams;

  if (id) {
    redirect(`/meetups/${id}`);
  }

  const initialEntries = await readMeetups();

  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <PageHeader
          title="라이딩 모임"
          description="번개·정기 크루·투어 일정을 등록하고 참가 인원을 확인하세요. 출발 시간, 집합 장소, 페이스까지 한눈에."
        />

        <MeetupExplorer
          initialEntries={initialEntries}
          initialQuery={q ?? ""}
        />
      </div>
    </div>
  );
}
