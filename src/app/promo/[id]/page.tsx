import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PromoDetailView from "@/components/promo/PromoDetailView";
import { toPublicEngagementItem } from "@/lib/engagement";
import { getPromoPost } from "@/lib/promo-store";
import { buildPageMetadata, truncateText } from "@/lib/seo";

export const dynamic = "force-dynamic";

type PromoDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PromoDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPromoPost(id);
  if (!post) {
    return buildPageMetadata({
      title: "홍보글을 찾을 수 없습니다",
      path: `/promo/${id}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: post.title,
    description: truncateText(post.content),
    path: `/promo/${post.id}`,
    image: post.imageUrls[0] ?? null,
    type: "article",
    keywords: [post.category, "바이크 홍보"],
  });
}

export default async function PromoDetailPage({ params }: PromoDetailPageProps) {
  const { id } = await params;
  const post = await getPromoPost(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <Link
          href="/promo"
          className="inline-flex items-center gap-1 text-sm font-semibold text-signature-dark transition hover:text-signature-darker"
        >
          ← 자유홍보 목록
        </Link>

        <PromoDetailView initialPost={toPublicEngagementItem(post)} />
      </div>
    </div>
  );
}
