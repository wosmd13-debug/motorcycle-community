import PageHeader from "@/components/PageHeader";
import MemberRouteCreateClient from "@/components/member-routes/MemberRouteCreateClient";

export default function MemberRouteCreatePage() {
  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <PageHeader
          title="바리코스 등록"
          description="네이버 지도에서 출발지·경유지·도착지를 찍어 나만의 동선을 등록하고, 저장 후 바로 네이버 내비로 안내받을 수 있습니다."
        />
        <MemberRouteCreateClient />
      </div>
    </div>
  );
}
