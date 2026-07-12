import type { MemberRoute } from "@/lib/member-route";
import type { BariRoute } from "@/lib/routes-data";
import { getRouteById as findRouteInList } from "@/lib/routes-data";
import {
  getPlacesForRoute,
  type RiderPlace,
} from "@/lib/places-data";
import type { RiderCafeEntry, RiderCafeRegion } from "@/lib/rider-cafe";
import { isDetailRegion } from "@/lib/regions";

export function getCafeRegionsForRoute(route: BariRoute): RiderCafeRegion[] {
  if (isDetailRegion(route.region)) {
    return [route.region];
  }
  return [];
}

export function getRoutesForCafeRegion(
  routes: BariRoute[],
  cafeRegion: RiderCafeRegion
): BariRoute[] {
  return routes.filter((route) => route.region === cafeRegion);
}

export function getCommunityCafesForRoute(
  route: BariRoute,
  entries: RiderCafeEntry[],
  limit = 5
): RiderCafeEntry[] {
  return entries
    .filter((entry) => entry.region === route.region)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, limit);
}

export function getRoutesForPlace(
  routes: BariRoute[],
  place: RiderPlace
): BariRoute[] {
  return place.routeLinks
    .map((link) => findRouteInList(routes, link.routeId))
    .filter((route): route is BariRoute => Boolean(route));
}

export function buildMapHref(options: {
  routeId?: number;
  memberRouteId?: string;
  placeId?: string;
}): string {
  if (options.memberRouteId) {
    return buildMemberRouteHref(options.memberRouteId);
  }

  if (options.routeId) {
    return buildRouteHref(options.routeId);
  }

  return "/map";
}

export function buildMemberMapHref(memberRouteId: string): string {
  return buildMapHref({ memberRouteId });
}

export function buildMemberRouteEditHref(memberRouteId: string): string {
  return `/routes/${encodeURIComponent(memberRouteId)}/edit`;
}

export function buildBariRouteEditHref(routeId: number): string {
  return `/routes/official/${routeId}/edit`;
}

export function buildMemberRouteHref(
  memberRouteId: string,
  query?: string
): string {
  const params = new URLSearchParams({ id: memberRouteId });
  if (query?.trim()) params.set("q", query.trim());
  return `/routes?${params.toString()}`;
}

export function buildRouteHref(routeId: number, query?: string): string {
  const params = new URLSearchParams({ id: String(routeId) });
  if (query?.trim()) params.set("q", query.trim());
  return `/routes?${params.toString()}`;
}

export function buildCafeHref(options: { id?: string; q?: string }): string {
  const params = new URLSearchParams();
  if (options.id) params.set("id", options.id);
  if (options.q?.trim()) params.set("q", options.q.trim());
  const query = params.toString();
  return query ? `/cafes?${query}` : "/cafes";
}

export function findBariRouteById(
  routes: BariRoute[],
  routeId: number
): BariRoute | undefined {
  return findRouteInList(routes, routeId);
}

export function getMemberRouteById(
  memberRouteId: string,
  routes: MemberRoute[]
): MemberRoute | undefined {
  return routes.find((route) => route.id === memberRouteId);
}

export function getPlaceCountLabel(routeId: number): string {
  const count = getPlacesForRoute(routeId).length;
  return count > 0 ? `스팟 ${count}곳` : "";
}
