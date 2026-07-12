import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import BariRouteEditClient from "@/components/routes/BariRouteEditClient";
import { getBariRoute } from "@/lib/bari-route-store";

export const dynamic = "force-dynamic";

type BariRouteEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BariRouteEditPage({
  params,
}: BariRouteEditPageProps) {
  const { id } = await params;
  const routeId = Number(id);

  if (!Number.isFinite(routeId)) {
    notFound();
  }

  const route = await getBariRoute(routeId);
  if (!route) {
    notFound();
  }

  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <PageHeader
          title="추천 바리코스 수정"
          description={`${route.name} 코스의 경유지와 상세 정보를 수정할 수 있습니다.`}
        />
        <BariRouteEditClient route={route} />
      </div>
    </div>
  );
}
