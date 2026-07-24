import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PromoExplorer from "@/components/promo/PromoExplorer";
import PromoWarningBanner from "@/components/promo/PromoWarningBanner";
import SiteBreadcrumbs from "@/components/seo/SiteBreadcrumbs";
import { toPublicEngagementList } from "@/lib/engagement";
import { readPromoPosts } from "@/lib/promo-store";
import { buildPageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "바이크 자유홍보",
  description:
    "바이크 샵·세차장·채널·행사 홍보. Byanra 자유홍보 게시판에서 라이더에게 알리세요.",
  path: "/promo",
  keywords: ["바이크 홍보", "오토바이 샵", "세차장"],
});

type PromoPageProps = {
  searchParams: Promise<{ q?: string; id?: string; category?: string }>;
};

export default async function PromoPage({ searchParams }: PromoPageProps) {
  const { q, id, category } = await searchParams;

  if (id) {
    redirect(`/promo/${id}`);
  }

  const initialPosts = toPublicEngagementList(await readPromoPosts());

  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <SiteBreadcrumbs
          items={[
            { name: "홈", href: "/" },
            { name: "자유홍보" },
          ]}
        />
        <PageHeader
          title="바이크 자유홍보"
          description="유튜브 채널, 매장·업체, 세차장, 중고 거래, 행사·이벤트 등 라이더 대상 홍보를 자유롭게 등록할 수 있는 공간입니다."
        />

        <PromoWarningBanner />

        <PromoExplorer
          initialPosts={initialPosts}
          initialQuery={q ?? ""}
          initialCategory={category ?? ""}
        />
      </div>
    </div>
  );
}
