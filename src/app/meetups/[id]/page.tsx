import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MeetupDetailView from "@/components/meetups/MeetupDetailView";
import JsonLd from "@/components/seo/JsonLd";
import SiteBreadcrumbs from "@/components/seo/SiteBreadcrumbs";
import { getMeetup } from "@/lib/meetup-store";
import {
  articleJsonLd,
  buildPageMetadata,
  truncateText,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type MeetupDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: MeetupDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const entry = await getMeetup(id);
  if (!entry) {
    return buildPageMetadata({
      title: "모임을 찾을 수 없습니다",
      path: `/meetups/${id}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: entry.title,
    description: truncateText(entry.description || entry.title),
    path: `/meetups/${entry.id}`,
    type: "article",
    keywords: ["라이딩 모집", entry.region ?? "라이딩 모임"],
  });
}

export default async function MeetupDetailPage({
  params,
}: MeetupDetailPageProps) {
  const { id } = await params;
  const entry = await getMeetup(id);

  if (!entry) {
    notFound();
  }

  return (
    <div className="portal-page py-4">
      <JsonLd
        data={articleJsonLd({
          title: entry.title,
          description: truncateText(entry.description || entry.title),
          path: `/meetups/${entry.id}`,
          datePublished: entry.createdAt,
          authorName: entry.author,
        })}
      />
      <div className="portal-container space-y-4">
        <SiteBreadcrumbs
          items={[
            { name: "홈", href: "/" },
            { name: "라이딩 모집", href: "/meetups" },
            { name: truncateText(entry.title, 48) },
          ]}
        />
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
