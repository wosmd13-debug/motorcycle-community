import PageHeader from "@/components/PageHeader";
import PromoExplorer from "@/components/promo/PromoExplorer";
import PromoWarningBanner from "@/components/promo/PromoWarningBanner";
import { toPublicEngagementList } from "@/lib/engagement";
import { readPromoPosts } from "@/lib/promo-store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

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
        <PageHeader
          title="자유홍보"
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
