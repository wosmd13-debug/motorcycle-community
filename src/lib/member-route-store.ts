import "server-only";

import { promises as fs } from "fs";
import path from "path";
import {
  computeRouteAnchor,
  normalizeMemberRoute,
  type CreateMemberRouteInput,
  type MemberRoute,
  type UpdateMemberRouteInput,
} from "@/lib/member-route";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "member-routes.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

async function writeMemberRoutes(routes: MemberRoute[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(routes, null, 2), "utf8");
}

export async function readMemberRoutes(): Promise<MemberRoute[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const routes = JSON.parse(raw) as MemberRoute[];
  return routes.map(normalizeMemberRoute);
}

export async function createMemberRoute(
  input: CreateMemberRouteInput
): Promise<MemberRoute> {
  const routes = await readMemberRoutes();
  const anchor = computeRouteAnchor(input.waypoints);
  const route = normalizeMemberRoute({
    id: crypto.randomUUID(),
    name: input.name,
    region: input.region,
    type: input.type,
    difficulty: input.difficulty,
    description: input.description ?? "",
    waypoints: input.waypoints,
    author: input.author,
    authorId: input.authorId,
    lat: anchor.lat,
    lng: anchor.lng,
    distanceKm: input.distanceKm,
    durationMin: input.durationMin,
    createdAt: new Date().toISOString(),
  });

  routes.unshift(route);
  await writeMemberRoutes(routes);
  return route;
}

export async function getMemberRoute(id: string): Promise<MemberRoute | null> {
  const routes = await readMemberRoutes();
  return routes.find((route) => route.id === id) ?? null;
}

export async function updateMemberRoute(
  id: string,
  input: UpdateMemberRouteInput
): Promise<MemberRoute | null> {
  const routes = await readMemberRoutes();
  const index = routes.findIndex((route) => route.id === id);
  if (index === -1) return null;

  const current = routes[index];
  const nextWaypoints = input.waypoints ?? current.waypoints;
  const anchor = computeRouteAnchor(nextWaypoints);

  const updated = normalizeMemberRoute({
    ...current,
    name: input.name ?? current.name,
    region: input.region ?? current.region,
    type: input.type ?? current.type,
    difficulty: input.difficulty ?? current.difficulty,
    description: input.description ?? current.description,
    waypoints: nextWaypoints,
    lat: anchor.lat,
    lng: anchor.lng,
    distanceKm:
      input.distanceKm !== undefined ? input.distanceKm : current.distanceKm,
    durationMin:
      input.durationMin !== undefined ? input.durationMin : current.durationMin,
    updatedAt: new Date().toISOString(),
  });

  routes[index] = updated;
  await writeMemberRoutes(routes);
  return updated;
}

export async function deleteMemberRoute(
  id: string
): Promise<{ deleted?: boolean; error?: string }> {
  const routes = await readMemberRoutes();
  const index = routes.findIndex((route) => route.id === id);
  if (index === -1) {
    return { error: "코스를 찾을 수 없습니다." };
  }

  routes.splice(index, 1);
  await writeMemberRoutes(routes);
  return { deleted: true };
}
