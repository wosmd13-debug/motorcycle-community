import { NextRequest, NextResponse } from "next/server";
import { getBariRoute } from "@/lib/bari-route-store";
import {
  buildDirectionsQuery,
  fetchMotorcycleDirections,
} from "@/lib/directions-server";
import {
  buildGpxDocument,
  pathToGpxPoints,
  sanitizeGpxFilename,
  waypointsToGpxPoints,
} from "@/lib/gpx";
import { getMemberRoute } from "@/lib/member-route-store";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const routeIdRaw = searchParams.get("routeId");
  const memberRouteId = searchParams.get("memberRouteId");

  try {
    if (routeIdRaw) {
      const routeId = Number(routeIdRaw);
      if (!Number.isFinite(routeId)) {
        return NextResponse.json(
          { error: "올바른 코스 ID가 필요합니다." },
          { status: 400 }
        );
      }

      const route = await getBariRoute(routeId);
      if (!route) {
        return NextResponse.json(
          { error: "코스를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      const query = buildDirectionsQuery(route.waypoints);
      let trackPoints = waypointsToGpxPoints(route.waypoints);
      let source: "directions" | "waypoints" = "waypoints";

      if (query) {
        const directions = await fetchMotorcycleDirections(query);
        if (directions.ok) {
          trackPoints = pathToGpxPoints(directions.data.path);
          source = "directions";
        }
      }

      const gpx = buildGpxDocument({
        name: route.name,
        description: `${route.region} · ${route.difficulty} · ${route.distance}`,
        trackPoints,
        waypoints: waypointsToGpxPoints(route.waypoints),
      });

      const filename = sanitizeGpxFilename(route.name) || `bari-route-${route.id}`;

      return new NextResponse(gpx, {
        headers: {
          "Content-Type": "application/gpx+xml; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.gpx"`,
          "X-Gpx-Source": source,
        },
      });
    }

    if (memberRouteId) {
      const route = await getMemberRoute(memberRouteId);
      if (!route) {
        return NextResponse.json(
          { error: "회원 코스를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      const query = buildDirectionsQuery(route.waypoints);
      let trackPoints = waypointsToGpxPoints(route.waypoints);
      let source: "directions" | "waypoints" = "waypoints";

      if (query) {
        const directions = await fetchMotorcycleDirections(query);
        if (directions.ok) {
          trackPoints = pathToGpxPoints(directions.data.path);
          source = "directions";
        }
      }

      const gpx = buildGpxDocument({
        name: route.name,
        description: `${route.region} · ${route.difficulty} · ${route.author}`,
        trackPoints,
        waypoints: waypointsToGpxPoints(route.waypoints),
      });

      const filename =
        sanitizeGpxFilename(route.name) || `member-route-${route.id.slice(0, 8)}`;

      return new NextResponse(gpx, {
        headers: {
          "Content-Type": "application/gpx+xml; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.gpx"`,
          "X-Gpx-Source": source,
        },
      });
    }

    return NextResponse.json(
      { error: "routeId 또는 memberRouteId가 필요합니다." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "GPX 파일을 생성하지 못했습니다." },
      { status: 500 }
    );
  }
}
