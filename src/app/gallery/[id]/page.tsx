import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GalleryDetailView from "@/components/gallery/GalleryDetailView";
import JsonLd from "@/components/seo/JsonLd";
import SiteBreadcrumbs from "@/components/seo/SiteBreadcrumbs";
import { toPublicEngagementItem } from "@/lib/engagement";
import { getGalleryPost } from "@/lib/gallery-store";
import {
  articleJsonLd,
  buildPageMetadata,
  truncateText,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type GalleryDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: GalleryDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getGalleryPost(id);
  if (!post) {
    return buildPageMetadata({
      title: "갤러리 글을 찾을 수 없습니다",
      path: `/gallery/${id}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: post.title,
    description: truncateText(post.caption || post.title),
    path: `/gallery/${post.id}`,
    image: post.imageUrl,
    type: "article",
    keywords: [post.category, "바이크 갤러리"],
  });
}

export default async function GalleryDetailPage({
  params,
}: GalleryDetailPageProps) {
  const { id } = await params;
  const post = await getGalleryPost(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="portal-page">
      <JsonLd
        data={articleJsonLd({
          title: post.title,
          description: truncateText(post.caption || post.title),
          path: `/gallery/${post.id}`,
          datePublished: post.createdAt,
          authorName: post.author,
          image: post.imageUrl,
        })}
      />
      <div className="portal-container space-y-3 sm:space-y-4">
        <SiteBreadcrumbs
          items={[
            { name: "홈", href: "/" },
            { name: "갤러리", href: "/gallery" },
            { name: truncateText(post.title, 48) },
          ]}
        />
        <Link
          href="/gallery"
          className="inline-flex items-center gap-1 text-sm font-semibold text-signature-dark transition hover:text-signature-darker"
        >
          ← 갤러리 목록
        </Link>

        <GalleryDetailView initialPost={toPublicEngagementItem(post)} />
      </div>
    </div>
  );
}
