import PageHeader from "@/components/PageHeader";
import MapPageContent from "@/components/map/MapPageContent";

export default function MapPage() {
  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <PageHeader
          title="지도"
          description="전국 지도를 네이버 지도로 확인할 수 있습니다. 코스·동선은 투어코스 메뉴에서 이용해 주세요."
        />

        <MapPageContent />
      </div>
    </div>
  );
}
