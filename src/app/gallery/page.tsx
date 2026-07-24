import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import GalleryExplorer from "@/components/gallery/GalleryExplorer";
import SiteBreadcrumbs from "@/components/seo/SiteBreadcrumbs";
import { toPublicEngagementList } from "@/lib/engagement";
import { readGalleryPosts } from "@/lib/gallery-store";
import { buildPageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "바이크 갤러리",
  description:
    "라이딩 인증샷, 바이크 사진, 풍경 갤러리. Byanra에서 라이더들의 사진을 공유하세요.",
  path: "/gallery",
  keywords: ["바이크 갤러리", "라이딩 사진", "오토바이 사진"],
});

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
        <SiteBreadcrumbs
          items={[
            { name: "홈", href: "/" },
            { name: "갤러리" },
          ]}
        />
        <PageHeader
          title="바이크 갤러리"
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
