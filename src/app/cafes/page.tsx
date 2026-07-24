import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import RiderCafeExplorer from "@/components/cafes/RiderCafeExplorer";
import SiteBreadcrumbs from "@/components/seo/SiteBreadcrumbs";
import { readBariRoutes } from "@/lib/bari-route-store";
import { toPublicEngagementList } from "@/lib/engagement";
import { readRiderCafes } from "@/lib/rider-cafe-store";
import { buildPageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "바이크 카페",
  description:
    "라이더가 모이는 바이크 카페·휴식 스팟 정보. Byanra에서 추천 카페를 등록하고 검색하세요.",
  path: "/cafes",
  keywords: ["바이크 카페", "라이더 카페", "오토바이 카페"],
});

type CafesPageProps = {
  searchParams: Promise<{ q?: string; id?: string }>;
};

export default async function CafesPage({ searchParams }: CafesPageProps) {
  const { q, id } = await searchParams;

  if (id) {
    redirect(`/cafes/${id}`);
  }

  const [initialEntries, initialBariRoutes] = await Promise.all([
    readRiderCafes().then(toPublicEngagementList),
    readBariRoutes(),
  ]);

  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <SiteBreadcrumbs
          items={[
            { name: "홈", href: "/" },
            { name: "바이크 카페" },
          ]}
        />
        <PageHeader
          title="바이크 카페"
          description="라이딩 중 추천하고 싶은 카페를 주소·사진과 함께 공유하세요. 전화번호, 영업시간, 오는 길 등 업체 정보도 등록할 수 있습니다."
        />

        <RiderCafeExplorer
          initialEntries={initialEntries}
          initialBariRoutes={initialBariRoutes}
          initialQuery={q ?? ""}
        />
      </div>
    </div>
  );
}
