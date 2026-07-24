import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import RoutesPageClient from "@/components/routes/RoutesPageClient";
import SiteBreadcrumbs from "@/components/seo/SiteBreadcrumbs";
import { readBariRoutes } from "@/lib/bari-route-store";
import { readMemberRoutes } from "@/lib/member-route-store";
import { readRiderCafes } from "@/lib/rider-cafe-store";
import { getRouteById } from "@/lib/routes-data";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "바리 코스·라이딩 루트",
  description:
    "추천 바리코스와 회원 등록 라이딩 루트. 네이버 지도·내비 연동으로 오토바이 투어 코스를 Byanra에서 확인하세요.",
  path: "/routes",
  keywords: ["바리 코스", "라이딩 코스", "오토바이 루트", "투어 코스"],
});

type RoutesPageProps = {
  searchParams: Promise<{ q?: string; id?: string; tab?: string; source?: string }>;
};

function resolveInitialSource(
  tab?: string,
  source?: string
): "전체" | "추천" | "회원등록" {
  if (source === "member" || source === "회원등록" || tab === "member") {
    return "회원등록";
  }
  if (source === "official" || source === "추천" || tab === "official") {
    return "추천";
  }
  return "전체";
}

export default async function RoutesPage({ searchParams }: RoutesPageProps) {
  const { q, id, tab, source } = await searchParams;
  const [communityCafes, memberRoutes, bariRoutes] = await Promise.all([
    readRiderCafes(),
    readMemberRoutes(),
    readBariRoutes(),
  ]);

  const routeExists = id
    ? getRouteById(bariRoutes, Number(id)) ||
      memberRoutes.some((route) => route.id === id)
    : false;

  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <SiteBreadcrumbs
          items={[
            { name: "홈", href: "/" },
            { name: "바리 코스" },
          ]}
        />
        <PageHeader
          title="바리 코스·라이딩 루트"
          description="추천 바리코스를 둘러보거나, 지도에 경유지를 찍어 나만의 동선을 등록하고 네이버 지도·내비로 바로 안내받을 수 있습니다."
        />

        <RoutesPageClient
          initialBariRoutes={bariRoutes}
          initialMemberRoutes={memberRoutes}
          initialCommunityCafes={communityCafes}
          initialQuery={q ?? ""}
          initialOpenId={routeExists ? (id ?? "") : ""}
          initialSource={resolveInitialSource(tab, source)}
        />
      </div>
    </div>
  );
}
