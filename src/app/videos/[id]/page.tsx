import Link from "next/link";
import { notFound } from "next/navigation";
import VideoDetailView from "@/components/videos/VideoDetailView";
import { getVideo } from "@/lib/video-store";

export const dynamic = "force-dynamic";

type VideoDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { id } = await params;
  const video = await getVideo(id);

  if (!video) {
    notFound();
  }

  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <Link
          href="/videos"
          className="inline-flex items-center gap-1 text-sm font-semibold text-signature-dark transition hover:text-signature-darker"
        >
          ← 영상 목록
        </Link>

        <VideoDetailView initialVideo={video} />
      </div>
    </div>
  );
}

