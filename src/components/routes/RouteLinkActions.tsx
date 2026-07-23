"use client";

import Link from "next/link";
import { NaverNavActionGroup } from "@/components/routes/NaverNavButton";
import ViewOnMapButton from "@/components/routes/ViewOnMapButton";
import {
  buildCafeHref,
  buildRouteHref,
} from "@/lib/route-links";
import type { RouteWaypoint } from "@/lib/routes-data";

type RouteLinkActionsProps = {
  routeId?: number;
  waypoints?: RouteWaypoint[];
  routeName?: string;
  placeId?: string;
  compact?: boolean;
};

export default function RouteLinkActions({
  routeId,
  waypoints = [],
  routeName,
  placeId,
  compact = false,
}: RouteLinkActionsProps) {
  const linkClass = compact
    ? "inline-flex items-center rounded-full border border-signature/25 bg-white px-3 py-1.5 text-xs font-semibold text-signature-dark hover:bg-signature-light"
    : "inline-flex items-center rounded-full border border-signature/30 bg-white px-4 py-2 text-sm font-semibold text-signature-darker hover:bg-signature-light";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {routeId != null && (
          <ViewOnMapButton routeId={routeId} className={linkClass} />
        )}
        {routeId != null && (
          <Link href={buildRouteHref(routeId)} className={linkClass}>
            코스 상세
          </Link>
        )}
        <Link href={buildCafeHref({})} className={linkClass}>
          바이크 카페
        </Link>
      </div>

      {waypoints.length >= 2 && (
        <NaverNavActionGroup
          waypoints={waypoints}
          routeName={routeName}
          compact={compact}
        />
      )}
    </div>
  );
}
