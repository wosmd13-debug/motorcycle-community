import PageHeader from "@/components/PageHeader";
import ServiceExplorer from "@/components/services/ServiceExplorer";
import { readBariRoutes } from "@/lib/bari-route-store";
import { isOpinetConfigured } from "@/lib/opinet-service";
import { getServicePlaces } from "@/lib/places-data";

type ServicesPageProps = {
  searchParams: Promise<{ q?: string; id?: string }>;
};

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const { q, id } = await searchParams;
  const [initialPlaces, initialBariRoutes] = await Promise.all([
    Promise.resolve(getServicePlaces()),
    readBariRoutes(),
  ]);

  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <PageHeader
          title="주유소 지도"
          description="네이버 지도에서 주변 주유소를 찾고 실시간 유가(OPINET)를 확인할 수 있습니다. 거리·가격순 정렬, 내 위치 이동, 5분마다 자동 갱신을 지원합니다. 세차장 홍보는 자유홍보 게시판의 세차장 카테고리를 이용해 주세요."
        />

        <ServiceExplorer
          initialPlaces={initialPlaces}
          initialBariRoutes={initialBariRoutes}
          initialQuery={q ?? ""}
          initialOpenId={id ?? ""}
          initialOpinetConfigured={isOpinetConfigured()}
        />
      </div>
    </div>
  );
}
