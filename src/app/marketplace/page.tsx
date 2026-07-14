import PageHeader from "@/components/PageHeader";
import MarketplaceExplorer from "@/components/marketplace/MarketplaceExplorer";
import MarketplaceTradeNotice from "@/components/marketplace/MarketplaceTradeNotice";
import { toPublicEngagementList } from "@/lib/engagement";
import { readMarketplaceItems } from "@/lib/marketplace-store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type MarketplacePageProps = {
  searchParams: Promise<{ q?: string; id?: string }>;
};

export default async function MarketplacePage({
  searchParams,
}: MarketplacePageProps) {
  const { q, id } = await searchParams;

  if (id) {
    redirect(`/marketplace/${id}`);
  }

  const initialItems = toPublicEngagementList(await readMarketplaceItems());

  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <PageHeader
          title="중고거래"
          description="헬멧, 자켓, 부품 등 바이크 용품을 회원들과 직접 거래할 수 있는 중고거래 공간입니다."
        />

        <MarketplaceTradeNotice />

        <MarketplaceExplorer
          initialItems={initialItems}
          initialQuery={q ?? ""}
        />
      </div>
    </div>
  );
}
