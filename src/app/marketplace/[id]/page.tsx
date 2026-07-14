import Link from "next/link";
import { notFound } from "next/navigation";
import MarketplaceDetailView from "@/components/marketplace/MarketplaceDetailView";
import { toPublicEngagementItem } from "@/lib/engagement";
import { getMarketplaceItem } from "@/lib/marketplace-store";

export const dynamic = "force-dynamic";

type MarketplaceDetailPageProps = {
  params: Promise<{ id: string }>;
};

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
      <div className="portal-container space-y-4">
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
