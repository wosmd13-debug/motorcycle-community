import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import VideoDetailView from "@/components/videos/VideoDetailView";
import JsonLd from "@/components/seo/JsonLd";
import SiteBreadcrumbs from "@/components/seo/SiteBreadcrumbs";
import { toPublicEngagementItem } from "@/lib/engagement";
import {
  articleJsonLd,
  buildPageMetadata,
  truncateText,
} from "@/lib/seo";
import { getYouTubeThumbnailUrl } from "@/lib/videos";
import { getVideo } from "@/lib/video-store";

export const dynamic = "force-dynamic";

type VideoDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: VideoDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) {
    return buildPageMetadata({
      title: "영상을 찾을 수 없습니다",
      path: `/videos/${id}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: video.title,
    description: truncateText(video.description || video.title),
    path: `/videos/${video.id}`,
    image: getYouTubeThumbnailUrl(video.youtubeVideoId),
    type: "article",
    keywords: ["바이크 영상", "라이딩 유튜브"],
  });
}

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { id } = await params;
  const video = await getVideo(id);

  if (!video) {
    notFound();
  }

  return (
    <div className="portal-page py-4">
      <JsonLd
        data={articleJsonLd({
          title: video.title,
          description: truncateText(video.description || video.title),
          path: `/videos/${video.id}`,
          datePublished: video.createdAt,
          authorName: video.submitter,
          image: getYouTubeThumbnailUrl(video.youtubeVideoId),
        })}
      />
      <div className="portal-container space-y-4">
        <SiteBreadcrumbs
          items={[
            { name: "홈", href: "/" },
            { name: "영상", href: "/videos" },
            { name: truncateText(video.title, 48) },
          ]}
        />
        <Link
          href="/videos"
          className="inline-flex items-center gap-1 text-sm font-semibold text-signature-dark transition hover:text-signature-darker"
        >
          ← 영상 목록
        </Link>

        <VideoDetailView initialVideo={toPublicEngagementItem(video)} />
      </div>
    </div>
  );
}
