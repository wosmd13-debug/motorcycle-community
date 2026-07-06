import PageHeader from "@/components/PageHeader";
import GalleryExplorer from "@/components/gallery/GalleryExplorer";

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        emoji="📸"
        title="갤러리"
        description="라이딩 인증샷, 바이크 사진, 크루 모임 사진을 공유해보세요."
      />

      <GalleryExplorer />
    </div>
  );
}
