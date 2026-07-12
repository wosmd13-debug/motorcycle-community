"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { canManageBariRoute } from "@/lib/bari-route";
import { buildBariRouteEditHref } from "@/lib/route-links";
import type { BariRoute } from "@/lib/routes-data";

type BariRouteManageActionsProps = {
  route: BariRoute;
};

export default function BariRouteManageActions({
  route,
}: BariRouteManageActionsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canManageBariRoute(user)) return null;

  const handleDelete = async () => {
    if (!window.confirm(`"${route.name}" 추천 코스를 삭제할까요?`)) return;

    setDeleting(true);
    setError(null);

    const response = await fetch(`/api/bari-routes/${route.id}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      setError((data.error as string) ?? "삭제에 실패했습니다.");
      setDeleting(false);
      return;
    }

    router.push("/routes?source=official");
    router.refresh();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
          운영 관리
        </span>
        <Link
          href={buildBariRouteEditHref(route.id)}
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
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
