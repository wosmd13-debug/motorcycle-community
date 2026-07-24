import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketplaceDetailView from "@/components/marketplace/MarketplaceDetailView";
import JsonLd from "@/components/seo/JsonLd";
import SiteBreadcrumbs from "@/components/seo/SiteBreadcrumbs";
import { toPublicEngagementItem } from "@/lib/engagement";
import { getMarketplaceItem } from "@/lib/marketplace-store";
import {
  articleJsonLd,
  buildPageMetadata,
  truncateText,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type MarketplaceDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: MarketplaceDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getMarketplaceItem(id);
  if (!item) {
    return buildPageMetadata({
      title: "매물을 찾을 수 없습니다",
      path: `/marketplace/${id}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: item.title,
    description: truncateText(item.description || item.title),
    path: `/marketplace/${item.id}`,
    image: item.imageUrls?.[0] ?? null,
    type: "article",
    keywords: [item.category, "바이크 중고"],
  });
}

export default async function MarketplaceDetailPage({
  params,
}: MarketplaceDetailPageProps) {
  const { id } = await params;
  const item = await getMarketplaceItem(id);

  if (!item) {
    notFound();
  }

  return (
    <div className="portal-page py-4">
      <JsonLd
        data={articleJsonLd({
          title: item.title,
          description: truncateText(item.description || item.title),
          path: `/marketplace/${item.id}`,
          datePublished: item.createdAt,
          authorName: item.seller,
          image: item.imageUrls?.[0] ?? null,
        })}
      />
      <div className="portal-container space-y-4">
        <SiteBreadcrumbs
          items={[
            { name: "홈", href: "/" },
            { name: "중고거래", href: "/marketplace" },
            { name: truncateText(item.title, 48) },
          ]}
        />
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1 text-sm font-semibold text-signature-dark transition hover:text-signature-darker"
        >
          ← 중고거래 목록
        </Link>

        <MarketplaceDetailView initialItem={toPublicEngagementItem(item)} />
      </div>
    </div>
  );
}
