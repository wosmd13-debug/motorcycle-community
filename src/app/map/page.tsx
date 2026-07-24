import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import MapPageContent from "@/components/map/MapPageContent";
import SiteBreadcrumbs from "@/components/seo/SiteBreadcrumbs";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "네이버 바이크 라이딩 지도",
  description:
    "Byanra 네이버 지도로 전국 라이딩 지역을 확인하세요. 투어 코스·동선은 바리 코스 메뉴에서 이용할 수 있습니다.",
  path: "/map",
  keywords: ["라이딩 지도", "네이버 지도", "오토바이 지도"],
});

export default function MapPage() {
  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <SiteBreadcrumbs
          items={[
            { name: "홈", href: "/" },
            { name: "지도" },
          ]}
        />
        <PageHeader
          title="네이버 바이크 라이딩 지도"
          description="전국 지도를 네이버 지도로 확인할 수 있습니다. 코스·동선은 투어코스 메뉴에서 이용해 주세요."
        />

        <MapPageContent />
      </div>
    </div>
  );
}
