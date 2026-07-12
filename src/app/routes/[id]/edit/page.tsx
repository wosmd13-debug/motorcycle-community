import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import MemberRouteEditClient from "@/components/member-routes/MemberRouteEditClient";
import { getMemberRoute } from "@/lib/member-route-store";

export const dynamic = "force-dynamic";

type MemberRouteEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MemberRouteEditPage({
  params,
}: MemberRouteEditPageProps) {
  const { id } = await params;
  const route = await getMemberRoute(id);

  if (!route) {
    notFound();
  }

  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <PageHeader
          title="바리코스 수정"
          description={`${route.name} 코스의 경유지와 정보를 수정할 수 있습니다.`}
        />
        <MemberRouteEditClient route={route} />
      </div>
    </div>
  );
}
