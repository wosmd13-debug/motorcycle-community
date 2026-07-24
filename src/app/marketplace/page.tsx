import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import MarketplaceExplorer from "@/components/marketplace/MarketplaceExplorer";
import MarketplaceTradeNotice from "@/components/marketplace/MarketplaceTradeNotice";
import SiteBreadcrumbs from "@/components/seo/SiteBreadcrumbs";
import { toPublicEngagementList } from "@/lib/engagement";
import { readMarketplaceItems } from "@/lib/marketplace-store";
import { buildPageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "바이크 중고거래",
  description:
    "헬멧·자켓·부품 등 오토바이 용품 중고거래. Byanra 회원과 안전하게 매물을 공유하세요.",
  path: "/marketplace",
  keywords: ["바이크 중고", "오토바이 중고거래", "헬멧 중고"],
});

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
        <SiteBreadcrumbs
          items={[
            { name: "홈", href: "/" },
            { name: "중고거래" },
          ]}
        />
        <PageHeader
          title="바이크 중고거래"
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
