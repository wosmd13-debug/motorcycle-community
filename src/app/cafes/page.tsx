import PageHeader from "@/components/PageHeader";
import RiderCafeExplorer from "@/components/cafes/RiderCafeExplorer";

export default function CafesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        emoji="☕"
        title="라이더 카페"
        description="라이딩 중 추천하고 싶은 카페를 주소·사진과 함께 공유하세요. 전화번호, 영업시간, 오는 길 등 업체 정보도 등록할 수 있습니다."
      />

      <RiderCafeExplorer />
    </div>
  );
}
