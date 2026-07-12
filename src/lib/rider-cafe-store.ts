import { promises as fs } from "fs";
import path from "path";
import {
  normalizeRiderCafeEntry,
  seedRiderCafes,
  isLegacyCafeRegion,
  type CreateRiderCafeInput,
  type RiderCafeEntry,
  type UpdateRiderCafeInput,
} from "@/lib/rider-cafe";
import { toggleLikeByUser } from "@/lib/engagement";
import { deleteUploadedPublicUrls } from "@/lib/upload-files";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "rider-cafes.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(seedRiderCafes, null, 2),
      "utf8"
    );
  }
}

export async function readRiderCafes(): Promise<RiderCafeEntry[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const entries = JSON.parse(raw) as (RiderCafeEntry & { openHours?: string })[];
  const normalized = entries.map(normalizeRiderCafeEntry);

  const needsMigration = entries.some(
    (entry) =>
      entry.openHours != null || isLegacyCafeRegion(String(entry.region))
  );

  if (needsMigration) {
    await writeRiderCafes(normalized);
  }

  return normalized;
}

async function writeRiderCafes(entries: RiderCafeEntry[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), "utf8");
}

export async function createRiderCafe(
  input: CreateRiderCafeInput
): Promise<RiderCafeEntry> {
  const entries = await readRiderCafes();
  const entry: RiderCafeEntry = {
    id: crypto.randomUUID(),
    ...input,
    amenities: input.amenities ?? [],
    likes: 0,
    views: 0,
    createdAt: new Date().toISOString(),
  };

  entries.unshift(entry);
  await writeRiderCafes(entries);
  return entry;
}

export async function getRiderCafe(id: string): Promise<RiderCafeEntry | null> {
  const entries = await readRiderCafes();
  return entries.find((entry) => entry.id === id) ?? null;
}

export async function likeRiderCafe(
  id: string,
  userId: string
): Promise<{ entry: RiderCafeEntry; liked: boolean } | null> {
  const entries = await readRiderCafes();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return null;

  const { item, liked } = toggleLikeByUser(entries[index], userId);
  entries[index] = item;
  await writeRiderCafes(entries);
  return { entry: entries[index], liked };
}

export async function viewRiderCafe(id: string): Promise<RiderCafeEntry | null> {
  const entries = await readRiderCafes();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return null;

  entries[index] = { ...entries[index], views: entries[index].views + 1 };
  await writeRiderCafes(entries);
  return entries[index];
}

export async function updateRiderCafe(
  id: string,
  input: UpdateRiderCafeInput
): Promise<RiderCafeEntry | null> {
  const entries = await readRiderCafes();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return null;

  const current = entries[index];
  if (
    input.imageUrl !== undefined &&
    input.imageUrl !== current.imageUrl
  ) {
    await deleteUploadedPublicUrls([current.imageUrl]);
  }

  entries[index] = normalizeRiderCafeEntry({
    ...current,
    ...input,
    amenities: input.amenities ?? current.amenities,
  });

  await writeRiderCafes(entries);
  return entries[index];
}

export async function deleteRiderCafe(id: string): Promise<boolean> {
  const entries = await readRiderCafes();
  const target = entries.find((entry) => entry.id === id);
  if (!target) return false;

  await deleteUploadedPublicUrls([target.imageUrl]);

  const next = entries.filter((entry) => entry.id !== id);
  await writeRiderCafes(next);
  return true;
}
