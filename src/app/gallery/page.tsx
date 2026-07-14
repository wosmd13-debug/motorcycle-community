import PageHeader from "@/components/PageHeader";
import GalleryExplorer from "@/components/gallery/GalleryExplorer";
import { toPublicEngagementList } from "@/lib/engagement";
import { readGalleryPosts } from "@/lib/gallery-store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type GalleryPageProps = {
  searchParams: Promise<{ q?: string; id?: string }>;
};

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const { q, id } = await searchParams;

  if (id) {
    redirect(`/gallery/${id}`);
  }

  const initialPosts = toPublicEngagementList(await readGalleryPosts());

  return (
    <div className="portal-page">
      <div className="portal-container space-y-3 sm:space-y-4">
        <PageHeader
          title="갤러리"
          description="라이딩 인증샷, 바이크 사진, 크루 모임 사진을 공유해보세요."
        />

        <GalleryExplorer
          initialPosts={initialPosts}
          initialQuery={q ?? ""}
        />
      </div>
    </div>
  );
}
