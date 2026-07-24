import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import MeetupExplorer from "@/components/meetups/MeetupExplorer";
import SiteBreadcrumbs from "@/components/seo/SiteBreadcrumbs";
import { readMeetups } from "@/lib/meetup-store";
import { buildPageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "라이딩 모집·모임",
  description:
    "주말 라이딩 모집, 크루 정기 모임, 초보 라이딩. Byanra에서 함께 달릴 라이더를 찾으세요.",
  path: "/meetups",
  keywords: ["라이딩 모집", "라이딩 모임", "오토바이 동호회", "바이크 크루"],
});

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
        <SiteBreadcrumbs
          items={[
            { name: "홈", href: "/" },
            { name: "라이딩 모집" },
          ]}
        />
        <PageHeader
          title="라이딩 모집·모임"
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
