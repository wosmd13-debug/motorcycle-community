import Link from "next/link";
import { notFound } from "next/navigation";
import MeetupDetailView from "@/components/meetups/MeetupDetailView";
import { getMeetup } from "@/lib/meetup-store";

export const dynamic = "force-dynamic";

type MeetupDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MeetupDetailPage({ params }: MeetupDetailPageProps) {
  const { id } = await params;
  const entry = await getMeetup(id);

  if (!entry) {
    notFound();
  }

  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <Link
          href="/meetups"
          className="inline-flex items-center gap-1 text-sm font-semibold text-signature-dark transition hover:text-signature-darker"
        >
          ← 모임 목록
        </Link>

        <MeetupDetailView initialEntry={entry} />
      </div>
    </div>
  );
}

