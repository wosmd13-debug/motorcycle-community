import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import VideoExplorer from "@/components/videos/VideoExplorer";
import SiteBreadcrumbs from "@/components/seo/SiteBreadcrumbs";
import { toPublicEngagementList } from "@/lib/engagement";
import { buildPageMetadata } from "@/lib/seo";
import { readVideos } from "@/lib/video-store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "바이크·라이딩 영상",
  description:
    "라이딩 영상, 바이크 리뷰, 정비 가이드 유튜브 모음. Byanra에서 채널을 홍보하고 영상을 공유하세요.",
  path: "/videos",
  keywords: ["바이크 유튜브", "라이딩 영상", "오토바이 리뷰"],
});

type VideosPageProps = {
  searchParams: Promise<{ q?: string; id?: string }>;
};

export default async function VideosPage({ searchParams }: VideosPageProps) {
  const { q, id } = await searchParams;

  if (id) {
    redirect(`/videos/${id}`);
  }

  const initialVideos = toPublicEngagementList(await readVideos());

  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <SiteBreadcrumbs
          items={[
            { name: "홈", href: "/" },
            { name: "영상" },
          ]}
        />
        <PageHeader
          title="바이크·라이딩 영상"
          description="유튜버·크리에이터가 라이딩 영상, 바이크 리뷰, 정비 가이드 등을 등록해 채널을 홍보할 수 있는 공간입니다. 유튜브 URL만 있으면 바로 등록할 수 있어요."
        />

        <VideoExplorer
          initialVideos={initialVideos}
          initialQuery={q ?? ""}
        />
      </div>
    </div>
  );
}
