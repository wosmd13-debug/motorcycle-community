import Link from "next/link";
import { notFound } from "next/navigation";
import RiderCafeDetailView from "@/components/cafes/RiderCafeDetailView";
import { getRiderCafe } from "@/lib/rider-cafe-store";

export const dynamic = "force-dynamic";

type RiderCafeDetailPageProps = {
  params: Promise<{ id: string }>;
};

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

        <RiderCafeDetailView initialEntry={entry} />
      </div>
    </div>
  );
}

