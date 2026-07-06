import PageHeader from "@/components/PageHeader";
import RouteExplorer from "@/components/routes/RouteExplorer";

export default function RoutesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        emoji="🏍️"
        title="바리 코스"
        description="라이더들이 자주 다니는 투어·일주 코스를 거리, 난이도, 경유지, 라이더 카페·휴식 스팟까지 한눈에 확인하세요."
      />

      <RouteExplorer />
    </div>
  );
}
