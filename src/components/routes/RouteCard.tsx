"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { canManageBariRoute } from "@/lib/bari-route";
import { getPlaceCountForRoute } from "@/lib/places-data";
import { buildBariRouteEditHref, buildRouteHref } from "@/lib/route-links";
import type { BariRoute } from "@/lib/routes-data";
import NaverNavButton from "@/components/routes/NaverNavButton";

type RouteCardProps = {
  route: BariRoute;
  isSelected: boolean;
  onSelect: () => void;
  onDeleted?: (routeId: number) => void;
};

const difficultyColor: Record<BariRoute["difficulty"], string> = {
  초급: "bg-emerald-100 text-emerald-700",
  중급: "bg-amber-100 text-amber-700",
  상급: "bg-rose-100 text-rose-700",
};

export default function RouteCard({
  route,
  isSelected,
  onSelect,
  onDeleted,
}: RouteCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const canManage = canManageBariRoute(user, route);
  const placeCount = getPlaceCountForRoute(route.id);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!canManage) return;
    if (!window.confirm(`"${route.name}" 추천 코스를 삭제할까요?`)) return;

    setDeleting(true);
    const response = await fetch(`/api/bari-routes/${route.id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    setDeleting(false);

    if (!response.ok) {
      window.alert((data.error as string) ?? "삭제에 실패했습니다.");
      return;
    }

    onDeleted?.(route.id);
    router.refresh();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`w-full cursor-pointer rounded-3xl border p-5 text-left shadow-sm transition ${
        isSelected
          ? "border-signature/40 bg-signature-light ring-2 ring-signature/30"
          : "border-signature/20 bg-white hover:border-signature/30"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-signature-light px-2.5 py-0.5 text-xs font-semibold text-signature-dark">
          {route.type}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${difficultyColor[route.difficulty]}`}
        >
          {route.difficulty}
        </span>
        <span className="text-xs text-slate-400">{route.region}</span>
        <span className="rounded-full bg-signature-muted px-2 py-0.5 text-[11px] font-bold text-signature-darker">
          추천
        </span>
      </div>

      <h3 className="mt-3 text-lg font-bold text-slate-800">{route.name}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
        {route.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span>{route.distance}</span>
          <span>{route.duration}</span>
          <span>
            평점 {route.rating} ({route.reviewCount})
          </span>
          {placeCount > 0 && (
            <Link
              href={buildRouteHref(route.id)}
              onClick={(event) => event.stopPropagation()}
              className="font-semibold text-signature-dark hover:underline"
            >
              스팟 {placeCount}곳
            </Link>
          )}
        </div>
        {route.waypoints.length >= 2 && (
          <div onClick={(event) => event.stopPropagation()}>
            <NaverNavButton
              waypoints={route.waypoints}
              routeName={route.name}
              compact
            />
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-400">
          {route.startPoint} → {route.endPoint}
        </p>
        {canManage && (
          <div
            className="flex gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            <Link
              href={buildBariRouteEditHref(route.id)}
              className="rounded-full border border-signature/25 bg-white px-2.5 py-1 text-[11px] font-semibold text-signature-dark hover:bg-signature-light"
            >
              수정
            </Link>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
            >
              {deleting ? "삭제 중..." : "삭제"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
