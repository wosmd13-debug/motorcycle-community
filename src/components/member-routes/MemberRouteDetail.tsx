"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import MemberRouteLinkActions from "@/components/member-routes/MemberRouteLinkActions";
import MemberRouteMapPrompt from "@/components/member-routes/MemberRouteMapPrompt";
import WaypointRouteMap from "@/components/member-routes/WaypointRouteMap";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import RouteDifficultyPanel from "@/components/routes/RouteDifficultyPanel";
import RouteGpxDownload from "@/components/routes/RouteGpxDownload";
import {
  canManageMemberRoute,
  formatMemberRouteDistance,
  formatMemberRouteDuration,
  type MemberRoute,
} from "@/lib/member-route";
import { estimateRestBreakCount } from "@/lib/route-detail";
import { buildMemberRouteEditHref } from "@/lib/route-links";
import ViewOnMapButton from "@/components/routes/ViewOnMapButton";

type MemberRouteDetailProps = {
  route: MemberRoute;
  showMap?: boolean;
  showMapSection?: boolean;
  onDeleted?: (routeId: string) => void;
};

export default function MemberRouteDetail({
  route,
  showMap = false,
  showMapSection = true,
  onDeleted,
}: MemberRouteDetailProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = canManageMemberRoute(user, route);

  const handleDelete = async () => {
    if (!canManage) return;
    if (!window.confirm("이 코스를 삭제할까요?")) return;

    setDeleting(true);
    setError(null);

    const response = await fetch(`/api/member-routes/${route.id}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      setError((data.error as string) ?? "삭제에 실패했습니다.");
      setDeleting(false);
      return;
    }

    onDeleted?.(route.id);
    router.push("/routes?source=member");
    router.refresh();
  };

  return (
    <section className="space-y-4 rounded-3xl border border-signature/20 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-signature-dark">
            회원 등록 바리코스
          </p>
          <h2 className="mt-1 text-2xl font-bold text-stone-800">{route.name}</h2>
          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-stone-500">
            <span>
              {route.region} · {route.type} · {route.difficulty}
            </span>
            <span aria-hidden>·</span>
            <AuthorWithGrade
              author={route.author}
              nicknameClassName="text-sm text-stone-500"
              className="inline-flex max-w-full flex-wrap items-center gap-1"
            />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ViewOnMapButton
            routeId={route.id}
            memberRoute
            className={
              showMap
                ? "rounded-full border border-signature/30 bg-signature-light px-4 py-2 text-xs font-semibold text-signature-dark hover:bg-signature-muted"
                : "portal-btn px-5 py-2.5 text-xs font-bold shadow-sm"
            }
          />
          <Link
            href={`/routes?id=${encodeURIComponent(route.id)}`}
            className="rounded-full border border-signature/30 bg-white px-4 py-2 text-xs font-semibold text-signature-dark hover:bg-signature-light"
          >
            코스 상세 보기
          </Link>
          {canManage && (
            <>
              <Link
                href={buildMemberRouteEditHref(route.id)}
                className="rounded-full border border-signature/30 bg-signature-light px-4 py-2 text-xs font-semibold text-signature-dark hover:bg-signature-muted"
              >
                수정
              </Link>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </>
          )}
        </div>
      </div>

      {route.description && (
        <p className="rounded-2xl bg-signature-light/60 px-4 py-3 text-sm leading-6 text-stone-600">
          {route.description}
        </p>
      )}

      <RouteDifficultyPanel
        difficulty={route.difficulty}
        distanceKm={route.distanceKm}
        duration={
          route.durationMin != null
            ? formatMemberRouteDuration(route.durationMin)
            : undefined
        }
      />

      {route.waypoints.length >= 2 && (
        <RouteGpxDownload
          memberRouteId={route.id}
          routeName={route.name}
        />
      )}

      <div className="rounded-2xl border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm text-stone-600">
        {route.distanceKm != null ? (
          <>
            약 {route.distanceKm}km 기준 권장 휴식{" "}
            {estimateRestBreakCount(route.distanceKm)}회 · 경유지 메모를 참고해
            휴식 계획을 세워보세요.
          </>
        ) : (
          <>경유지 메모를 참고해 휴식·주유 계획을 세워보세요.</>
        )}
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-signature-light/60 px-4 py-3">
          <dt className="text-xs text-stone-500">거리</dt>
          <dd className="mt-1 text-sm font-bold text-stone-800">
            {formatMemberRouteDistance(route.distanceKm)}
          </dd>
        </div>
        <div className="rounded-2xl bg-signature-light/60 px-4 py-3">
          <dt className="text-xs text-stone-500">예상 시간</dt>
          <dd className="mt-1 text-sm font-bold text-stone-800">
            {formatMemberRouteDuration(route.durationMin)}
          </dd>
        </div>
        <div className="rounded-2xl bg-signature-light/60 px-4 py-3">
          <dt className="text-xs text-stone-500">경유지</dt>
          <dd className="mt-1 text-sm font-bold text-stone-800">
            {route.waypoints.length}곳
          </dd>
        </div>
      </dl>

      {showMapSection &&
        (showMap ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-signature/25 bg-signature-light/50 px-4 py-3 text-sm text-stone-600">
              <strong className="text-signature-dark">지도에서 보기</strong>로
              연 경로 화면입니다. 아래 지도에서{" "}
              <strong className="text-stone-800">{route.name}</strong> 동선을
              확인할 수 있습니다.
            </div>
            <WaypointRouteMap
              key={route.id}
              waypoints={route.waypoints}
              mapKey={route.id}
            />
          </div>
        ) : (
          <MemberRouteMapPrompt
            routeId={route.id}
            routeName={route.name}
            waypointCount={route.waypoints.length}
          />
        ))}

      {route.waypoints.length >= 2 && (
        <MemberRouteLinkActions
          memberRouteId={route.id}
          waypoints={route.waypoints}
          routeName={route.name}
        />
      )}

      <div>
        <h3 className="text-sm font-bold text-stone-800">경유지</h3>
        <ol className="mt-3 space-y-2">
          {route.waypoints.map((waypoint, index) => (
            <li
              key={`${route.id}-${index}`}
              className="rounded-2xl border border-signature/20 px-4 py-3 text-sm"
            >
              <p className="font-semibold text-stone-800">
                {index + 1}. {waypoint.name}
              </p>
              {waypoint.note && (
                <p className="mt-1 text-stone-500">{waypoint.note}</p>
              )}
            </li>
          ))}
        </ol>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}
