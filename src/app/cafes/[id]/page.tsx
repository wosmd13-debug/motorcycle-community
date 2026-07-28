import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RiderCafeDetailView from "@/components/cafes/RiderCafeDetailView";
import { toPublicEngagementItem } from "@/lib/engagement";
import { getRiderCafe } from "@/lib/rider-cafe-store";
import { buildPageMetadata, truncateText } from "@/lib/seo";

export const dynamic = "force-dynamic";

type RiderCafeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: RiderCafeDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const entry = await getRiderCafe(id);
  if (!entry) {
    return buildPageMetadata({
      title: "카페를 찾을 수 없습니다",
      path: `/cafes/${id}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: entry.name,
    description: truncateText(entry.description || entry.address || entry.name),
    path: `/cafes/${entry.id}`,
    image: entry.imageUrl || null,
    type: "article",
    keywords: [entry.region, "바이크 카페"],
  });
}

export default async function RiderCafeDetailPage({
  params,
}: RiderCafeDetailPageProps) {
  const { id } = await params;
  const entry = await getRiderCafe(id);

  if (!entry) {
    notFound();
  }

  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <Link
          href="/cafes"
          className="inline-flex items-center gap-1 text-sm font-semibold text-signature-dark transition hover:text-signature-darker"
        >
          ← 카페 목록
        </Link>

        <RiderCafeDetailView initialEntry={toPublicEngagementItem(entry)} />
      </div>
    </div>
  );
}
