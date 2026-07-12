import Link from "next/link";
import { notFound } from "next/navigation";
import GalleryDetailView from "@/components/gallery/GalleryDetailView";
import { getGalleryPost } from "@/lib/gallery-store";

export const dynamic = "force-dynamic";

type GalleryDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GalleryDetailPage({ params }: GalleryDetailPageProps) {
  const { id } = await params;
  const post = await getGalleryPost(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="portal-page">
      <div className="portal-container space-y-3 sm:space-y-4">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-1 text-sm font-semibold text-signature-dark transition hover:text-signature-darker"
        >
          ← 갤러리 목록
        </Link>

        <GalleryDetailView initialPost={post} />
      </div>
    </div>
  );
}
