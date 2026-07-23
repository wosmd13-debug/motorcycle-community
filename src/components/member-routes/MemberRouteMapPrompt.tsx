import ViewOnMapButton from "@/components/routes/ViewOnMapButton";

type MemberRouteMapPromptProps = {
  routeId: string;
  routeName: string;
  waypointCount: number;
};

export default function MemberRouteMapPrompt({
  routeId,
  routeName,
  waypointCount,
}: MemberRouteMapPromptProps) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-signature/35 bg-gradient-to-br from-signature-light/90 via-white to-signature-light/40 p-6 text-center shadow-sm sm:p-8">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-signature/15 text-3xl"
        aria-hidden
      >
        🗺️
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-signature-dark">
        경로 지도 안내
      </p>
      <h3 className="mt-2 text-lg font-bold text-stone-800">
        지도에서 보기 버튼을 눌러 경로를 확인하세요
      </h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-600">
        코스 목록에서 다른 코스를 선택하면 이 화면의 미리보기 지도는 표시되지
        않습니다.{" "}
        <strong className="text-signature-dark">{routeName}</strong>의 경로를
        지도에서 보려면 아래{" "}
        <strong className="text-signature-dark">지도에서 보기</strong> 버튼을
        눌러 주세요.
      </p>
      {waypointCount >= 2 && (
        <p className="mt-2 text-xs text-stone-500">
          {waypointCount}개 경유지 · 네이버 지도 경로 · 내비 연동
        </p>
      )}
      <ViewOnMapButton
        routeId={routeId}
        memberRoute
        className="portal-btn mt-6 inline-flex min-h-[48px] items-center justify-center px-6 py-3 text-sm font-bold shadow-md"
      />
      <p className="mt-3 text-xs text-stone-400">
        전용 화면에서 경로가 지도에 표시됩니다
      </p>
    </div>
  );
}
