import "server-only";

import { promises as fs } from "fs";
import path from "path";
import {
  normalizeBariRoute,
  type UpdateBariRouteInput,
} from "@/lib/bari-route";
import { defaultBariRoutes, type BariRoute } from "@/lib/routes-data";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "bari-routes.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(defaultBariRoutes, null, 2),
      "utf8"
    );
  }
}

async function writeBariRoutes(routes: BariRoute[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(routes, null, 2), "utf8");
}

export async function readBariRoutes(): Promise<BariRoute[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const routes = JSON.parse(raw) as BariRoute[];
  return routes.map(normalizeBariRoute);
}

export async function getBariRoute(id: number): Promise<BariRoute | null> {
  const routes = await readBariRoutes();
  return routes.find((route) => route.id === id) ?? null;
}

export async function updateBariRoute(
  id: number,
  input: UpdateBariRouteInput
): Promise<BariRoute | null> {
  const routes = await readBariRoutes();
  const index = routes.findIndex((route) => route.id === id);
  if (index === -1) return null;

  const current = routes[index];
  const updated = normalizeBariRoute({
    ...current,
    name: input.name ?? current.name,
    region: input.region ?? current.region,
    type: input.type ?? current.type,
    difficulty: input.difficulty ?? current.difficulty,
    distance: input.distance ?? current.distance,
    distanceKm:
      input.distanceKm !== undefined ? input.distanceKm : current.distanceKm,
    duration: input.duration ?? current.duration,
    bestSeason: input.bestSeason ?? current.bestSeason,
    description: input.description ?? current.description,
    startPoint: input.startPoint ?? current.startPoint,
    endPoint: input.endPoint ?? current.endPoint,
    waypoints: input.waypoints ?? current.waypoints,
    highlights: input.highlights ?? current.highlights,
    tips: input.tips ?? current.tips,
    cautions: input.cautions ?? current.cautions,
    rating: input.rating !== undefined ? input.rating : current.rating,
    reviewCount:
      input.reviewCount !== undefined ? input.reviewCount : current.reviewCount,
  });

  routes[index] = updated;
  await writeBariRoutes(routes);
  return updated;
}

export async function deleteBariRoute(
  id: number
): Promise<{ deleted?: boolean; error?: string }> {
  const routes = await readBariRoutes();
  const index = routes.findIndex((route) => route.id === id);
  if (index === -1) {
    return { error: "코스를 찾을 수 없습니다." };
  }

  routes.splice(index, 1);
  await writeBariRoutes(routes);
  return { deleted: true };
}
