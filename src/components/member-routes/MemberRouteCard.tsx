"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import {
  canManageMemberRoute,
  formatMemberRouteDistance,
  formatMemberRouteDuration,
  type MemberRoute,
} from "@/lib/member-route";
import { buildMemberRouteEditHref } from "@/lib/route-links";
import NaverNavButton from "@/components/routes/NaverNavButton";

type MemberRouteCardProps = {
  route: MemberRoute;
  isSelected: boolean;
  onSelect: () => void;
  onDeleted?: (routeId: string) => void;
};

export default function MemberRouteCard({
  route,
  isSelected,
  onSelect,
  onDeleted,
}: MemberRouteCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const canManage = canManageMemberRoute(user, route);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!canManage) return;
    if (!window.confirm(`"${route.name}" 코스를 삭제할까요?`)) return;

    setDeleting(true);
    const response = await fetch(`/api/member-routes/${route.id}`, {
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
      className={`w-full cursor-pointer rounded-3xl border p-4 text-left transition ${
        isSelected
          ? "border-signature bg-signature-light/50 shadow-sm"
          : "border-signature/20 bg-white hover:border-signature/40 hover:bg-signature-light/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-stone-800">{route.name}</p>
          <p className="mt-1 text-xs text-stone-500">
            {route.region} · {route.type} · {route.difficulty}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-signature/10 px-2 py-0.5 text-[11px] font-bold text-signature-dark">
          회원등록
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-stone-600">
        {route.description || "설명 없음"}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 text-xs text-stone-500">
          <span>{formatMemberRouteDistance(route.distanceKm)}</span>
          <span>·</span>
          <span>{formatMemberRouteDuration(route.durationMin)}</span>
          <span>·</span>
          <span>{route.waypoints.length}개 경유지</span>
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
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="flex flex-wrap items-center gap-1 text-xs text-stone-400">
          <span>by</span>
          <AuthorWithGrade
            author={route.author}
            nicknameClassName="text-xs text-stone-400"
            className="inline-flex max-w-full flex-wrap items-center gap-1"
          />
        </p>
        {canManage && (
          <div
            className="flex gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            <Link
              href={buildMemberRouteEditHref(route.id)}
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
