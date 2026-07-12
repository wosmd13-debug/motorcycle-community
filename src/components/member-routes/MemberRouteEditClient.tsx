"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import LoginRequired from "@/components/auth/LoginRequired";
import CourseBuilderMap from "@/components/member-routes/CourseBuilderMap";
import WaypointEditor from "@/components/member-routes/WaypointEditor";
import { NaverNavActionGroup } from "@/components/routes/NaverNavButton";
import {
  canManageMemberRoute,
  metersToKm,
  msToMinutes,
  type MemberRoute,
} from "@/lib/member-route";
import {
  routeDifficulties,
  routeRegions,
  routeTypes,
  type RouteDifficulty,
  type RouteType,
  type RouteWaypoint,
} from "@/lib/routes-data";
import { buildDirectionsQuery } from "@/lib/naver-directions";
import type { DetailRegion } from "@/lib/regions";
import { useAuth } from "@/components/auth/AuthProvider";

type MemberRouteEditClientProps = {
  route: MemberRoute;
};

function MemberRouteEditForm({ route }: MemberRouteEditClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState(route.name);
  const [region, setRegion] = useState<DetailRegion>(route.region);
  const [type, setType] = useState<RouteType>(route.type);
  const [difficulty, setDifficulty] = useState<RouteDifficulty>(route.difficulty);
  const [description, setDescription] = useState(route.description);
  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>(route.waypoints);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const regionOptions = useMemo(
    () => routeRegions.filter((item) => item !== "전체") as DetailRegion[],
    []
  );

  if (!canManageMemberRoute(user, route)) {
    return (
      <div className="rounded-3xl border border-signature/20 bg-white p-6 text-center">
        <p className="font-semibold text-stone-700">
          이 바리코스를 수정할 권한이 없습니다.
        </p>
        <Link
          href={`/routes?id=${encodeURIComponent(route.id)}`}
          className="portal-btn mt-4 inline-flex px-4 py-2 text-sm"
        >
          코스 상세로 돌아가기
        </Link>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (waypoints.length < 2) {
      setError("지도에서 출발지와 도착지를 포함해 2곳 이상 찍어 주세요.");
      return;
    }

    setSubmitting(true);

    let distanceKm: number | undefined;
    let durationMin: number | undefined;

    const query = buildDirectionsQuery(waypoints);
    if (query) {
      try {
        const params = new URLSearchParams({ start: query.start, goal: query.goal });
        if (query.waypoints) params.set("waypoints", query.waypoints);
        const response = await fetch(`/api/directions?${params.toString()}`);
        const data = await response.json();
        if (response.ok) {
          distanceKm = metersToKm(data.summary.distance);
          durationMin = msToMinutes(data.summary.duration);
        }
      } catch {
        // optional preview values
      }
    }

    const response = await fetch(`/api/member-routes/${route.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        region,
        type,
        difficulty,
        description,
        waypoints,
        distanceKm,
        durationMin,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError((data.error as string) ?? "코스 수정에 실패했습니다.");
      setSubmitting(false);
      return;
    }

    router.push(`/routes?id=${encodeURIComponent(route.id)}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <section className="portal-panel overflow-hidden">
        <div className="portal-panel-head">
          <h2 className="portal-panel-title">지도에서 코스 수정</h2>
        </div>
        <div className="grid gap-4 p-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <CourseBuilderMap waypoints={waypoints} onChange={setWaypoints} />
            {waypoints.length >= 2 && (
              <div className="rounded-2xl border border-signature/20 bg-signature-light/50 p-4">
                <p className="text-xs font-semibold text-stone-600">
                  수정 중 네이버 지도·내비 연동 미리보기
                </p>
                <div className="mt-3">
                  <NaverNavActionGroup
                    waypoints={waypoints}
                    routeName={name || route.name}
                    compact
                  />
                </div>
              </div>
            )}
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-800">경유지 목록</h3>
              <button
                type="button"
                onClick={() => setWaypoints([])}
                className="text-xs text-stone-500 hover:text-red-600"
              >
                전체 삭제
              </button>
            </div>
            <WaypointEditor waypoints={waypoints} onChange={setWaypoints} />
          </div>
        </div>
      </section>

      <section className="portal-panel space-y-4 p-6">
        <div>
          <h2 className="text-lg font-bold text-stone-800">바리코스 정보</h2>
          <p className="mt-1 text-sm text-stone-500">
            변경된 내용을 저장하면 목록과 지도·내비 연동에 반영됩니다.
          </p>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-stone-700">코스 이름</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="예) 양양 해안 당일치기"
            className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">지역</span>
            <select
              value={region}
              onChange={(event) => setRegion(event.target.value as DetailRegion)}
              className="mt-2 w-full border border-signature/20 bg-white px-4 py-3 text-sm outline-none focus:border-signature"
            >
              {regionOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">유형</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as RouteType)}
              className="mt-2 w-full border border-signature/20 bg-white px-4 py-3 text-sm outline-none focus:border-signature"
            >
              {routeTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">난이도</span>
            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value as RouteDifficulty)
              }
              className="mt-2 w-full border border-signature/20 bg-white px-4 py-3 text-sm outline-none focus:border-signature"
            >
              {routeDifficulties.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-stone-700">코스 설명</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="코스 특징, 추천 시즌, 주의사항 등을 적어 주세요."
            className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
          />
        </label>

        {error && (
          <p className="bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="portal-btn px-5 py-3 text-sm disabled:opacity-60"
          >
            {submitting ? "저장 중..." : "수정 내용 저장"}
          </button>
          <Link
            href={`/routes?id=${encodeURIComponent(route.id)}`}
            className="border border-signature/30 bg-white px-5 py-3 text-sm font-semibold text-stone-600 hover:bg-signature-light"
          >
            취소
          </Link>
        </div>
      </section>
    </form>
  );
}

export default function MemberRouteEditClient({ route }: MemberRouteEditClientProps) {
  return (
    <LoginRequired actionLabel="바리코스 수정">
      <MemberRouteEditForm route={route} />
    </LoginRequired>
  );
}
