import Link from "next/link";
import { notFound } from "next/navigation";
import PromoDetailView from "@/components/promo/PromoDetailView";
import { getPromoPost } from "@/lib/promo-store";

export const dynamic = "force-dynamic";

type PromoDetailPageProps = {
  params: Promise<{ id: string }>;
};

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

        <PromoDetailView initialPost={post} />
      </div>
    </div>
  );
}

