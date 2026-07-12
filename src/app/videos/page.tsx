import PageHeader from "@/components/PageHeader";
import VideoExplorer from "@/components/videos/VideoExplorer";
import { readVideos } from "@/lib/video-store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type VideosPageProps = {
  searchParams: Promise<{ q?: string; id?: string }>;
};

export default async function VideosPage({ searchParams }: VideosPageProps) {
  const { q, id } = await searchParams;

  if (id) {
    redirect(`/videos/${id}`);
  }

  const initialVideos = await readVideos();

  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <PageHeader
          title="영상"
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
