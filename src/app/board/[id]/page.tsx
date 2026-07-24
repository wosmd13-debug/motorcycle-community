import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BoardDetailView from "@/components/board/BoardDetailView";
import JsonLd from "@/components/seo/JsonLd";
import SiteBreadcrumbs from "@/components/seo/SiteBreadcrumbs";
import { getBoardPost } from "@/lib/board-store";
import { toPublicEngagementItem } from "@/lib/engagement";
import {
  articleJsonLd,
  buildPageMetadata,
  truncateText,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type BoardDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: BoardDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getBoardPost(id);
  if (!post) {
    return buildPageMetadata({
      title: "게시글을 찾을 수 없습니다",
      path: `/board/${id}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: post.title,
    description: truncateText(post.content),
    path: `/board/${post.id}`,
    image: post.imageUrls[0] ?? null,
    type: "article",
    keywords: [post.category, "바이크 게시판"],
  });
}

export default async function BoardDetailPage({ params }: BoardDetailPageProps) {
  const { id } = await params;
  const post = await getBoardPost(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="portal-page">
      <JsonLd
        data={articleJsonLd({
          title: post.title,
          description: truncateText(post.content),
          path: `/board/${post.id}`,
          datePublished: post.createdAt,
          authorName: post.author,
          image: post.imageUrls[0] ?? null,
        })}
      />
      <div className="portal-container space-y-3 sm:space-y-4">
        <SiteBreadcrumbs
          items={[
            { name: "홈", href: "/" },
            { name: "자유게시판", href: "/board" },
            { name: truncateText(post.title, 48) },
          ]}
        />
        <Link
          href="/board"
          className="inline-flex items-center gap-1 text-sm font-semibold text-signature-dark transition hover:text-signature-darker"
        >
          ← 게시판 목록
        </Link>

        <BoardDetailView initialPost={toPublicEngagementItem(post)} />
      </div>
    </div>
  );
}
