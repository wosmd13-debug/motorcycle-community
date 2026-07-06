import PageHeader from "@/components/PageHeader";
import MapPageContent from "@/components/map/MapPageContent";
import { ridingSpots } from "@/lib/mock-data";

export default function MapPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        emoji="🗺️"
        title="라이딩 지도"
        description="전국 바리 코스 동선과 라이더들이 추천하는 인기 스팟을 지도에서 확인해보세요."
      />

      <MapPageContent spots={ridingSpots} />
    </div>
  );
}
