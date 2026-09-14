import { promises as fs } from "fs";
import path from "path";
import {
  createBikeEntry,
  createEmptyBikeProfile,
  normalizeBikeProfile,
  normalizeMaintenanceLog,
  reconcileLastServiceAfterLogsChange,
  serviceIntervalKeys,
  sortMaintenanceLogs,
  syncBikeMileageFromLogs,
  type BikeEntry,
  type BikeProfile,
  type CreateMaintenanceLogInput,
  type MaintenanceLog,
  type ServiceIntervalKey,
  type UpdateMaintenanceLogInput,
  type UserBikeGarage,
} from "@/lib/bike-garage";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "bike-garage.json");

type GarageStore = Record<string, UserBikeGarage>;

/** 이전(바이크 1대) 저장 형식 — 자동 변환용 */
type LegacyUserBikeGarage = {
  userId: string;
  bike: BikeProfile | null;
  logs: MaintenanceLog[];
  updatedAt: string;
};

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "{}", "utf8");
  }
}

function emptyGarage(userId: string): UserBikeGarage {
  return {
    userId,
    bikes: [],
    updatedAt: new Date().toISOString(),
  };
}

function normalizeBikeEntry(entry: BikeEntry): BikeEntry {
  return {
    id: entry.id,
    profile: normalizeBikeProfile(entry.profile),
    logs: sortMaintenanceLogs((entry.logs ?? []).map(normalizeMaintenanceLog)),
  };
}

function isLegacyRecord(
  value: unknown
): value is LegacyUserBikeGarage {
  return Boolean(
    value &&
      typeof value === "object" &&
      "bike" in (value as Record<string, unknown>) &&
      !("bikes" in (value as Record<string, unknown>))
  );
}

function migrateLegacyRecord(
  userId: string,
  legacy: LegacyUserBikeGarage
): UserBikeGarage {
  const logs = legacy.logs ?? [];
  // 바이크 프로필이 없어도 일지가 남아있으면 유실되지 않게 빈 프로필로 감싼다.
  if (!legacy.bike && logs.length === 0) return emptyGarage(userId);

  const entry: BikeEntry = {
    id: crypto.randomUUID(),
    profile: normalizeBikeProfile(legacy.bike ?? createEmptyBikeProfile()),
    logs: sortMaintenanceLogs(logs.map(normalizeMaintenanceLog)),
  };

  return {
    userId,
    bikes: [entry],
    updatedAt: legacy.updatedAt ?? new Date().toISOString(),
  };
}

async function readStore(): Promise<GarageStore> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw) as Record<string, unknown>;

  const store: GarageStore = {};
  let migrated = false;

  for (const [userId, value] of Object.entries(parsed)) {
    if (isLegacyRecord(value)) {
      store[userId] = migrateLegacyRecord(userId, value);
      migrated = true;
      continue;
    }

    const record = value as UserBikeGarage;
    store[userId] = {
      userId,
      bikes: (record.bikes ?? []).map(normalizeBikeEntry),
      updatedAt: record.updatedAt ?? new Date().toISOString(),
    };
  }

  if (migrated) {
    await writeStore(store);
  }

  return store;
}

async function writeStore(store: GarageStore) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

function findBike(garage: UserBikeGarage, bikeId: string): BikeEntry | undefined {
  return garage.bikes.find((entry) => entry.id === bikeId);
}

export async function getUserBikeGarage(userId: string): Promise<UserBikeGarage> {
  const store = await readStore();
  return store[userId] ?? emptyGarage(userId);
}

export async function addBikeToGarage(
  userId: string,
  input: Partial<Omit<BikeProfile, "lastServiceAt">> & {
    model: string;
    lastServiceAt?: Partial<Record<ServiceIntervalKey, number | null>>;
  }
): Promise<UserBikeGarage> {
  const store = await readStore();
  const current = store[userId] ?? emptyGarage(userId);

  const lastServiceAt: Partial<Record<ServiceIntervalKey, number>> = {};
  if (input.lastServiceAt) {
    for (const key of serviceIntervalKeys) {
      const value = input.lastServiceAt[key];
      if (value != null) lastServiceAt[key] = value;
    }
  }

  const entry = createBikeEntry({
    ...input,
    model: input.model.trim(),
    year: input.year != null ? Number(input.year) : undefined,
    currentMileage: Math.max(0, Number(input.currentMileage ?? 0)),
    lastServiceAt,
  });

  const next: UserBikeGarage = {
    ...current,
    bikes: [...current.bikes, entry],
    updatedAt: new Date().toISOString(),
  };

  store[userId] = next;
  await writeStore(store);
  return next;
}

export async function updateBikeProfile(
  userId: string,
  bikeId: string,
  input: Partial<Omit<BikeProfile, "lastServiceAt">> & {
    model: string;
    lastServiceAt?: Partial<Record<ServiceIntervalKey, number | null>>;
  }
): Promise<UserBikeGarage | null> {
  const store = await readStore();
  const current = store[userId];
  const existing = current ? findBike(current, bikeId) : undefined;
  if (!current || !existing) return null;

  const lastServiceAt: Partial<Record<ServiceIntervalKey, number>> = {
    ...existing.profile.lastServiceAt,
  };
  if (input.lastServiceAt) {
    for (const key of serviceIntervalKeys) {
      if (!(key in input.lastServiceAt)) continue;
      const value = input.lastServiceAt[key];
      if (value == null) {
        delete lastServiceAt[key];
      } else {
        lastServiceAt[key] = value;
      }
    }
  }

  const profile = syncBikeMileageFromLogs(
    normalizeBikeProfile({
      ...existing.profile,
      ...input,
      model: input.model.trim(),
      year: input.year != null ? Number(input.year) : undefined,
      currentMileage: Math.max(
        0,
        Number(input.currentMileage ?? existing.profile.currentMileage)
      ),
      serviceIntervals: {
        ...existing.profile.serviceIntervals,
        ...input.serviceIntervals,
      },
      lastServiceAt,
    }),
    existing.logs
  );

  const bikes = current.bikes.map((entry) =>
    entry.id === bikeId ? { ...entry, profile } : entry
  );

  const next: UserBikeGarage = {
    ...current,
    bikes,
    updatedAt: new Date().toISOString(),
  };

  store[userId] = next;
  await writeStore(store);
  return next;
}

export async function deleteBike(
  userId: string,
  bikeId: string
): Promise<UserBikeGarage | null> {
  const store = await readStore();
  const current = store[userId];
  if (!current || !findBike(current, bikeId)) return null;

  const next: UserBikeGarage = {
    ...current,
    bikes: current.bikes.filter((entry) => entry.id !== bikeId),
    updatedAt: new Date().toISOString(),
  };

  store[userId] = next;
  await writeStore(store);
  return next;
}

export async function addMaintenanceLog(
  userId: string,
  bikeId: string,
  input: CreateMaintenanceLogInput
): Promise<UserBikeGarage | null> {
  const store = await readStore();
  const current = store[userId];
  const existing = current ? findBike(current, bikeId) : undefined;
  if (!current || !existing) return null;

  const log: MaintenanceLog = normalizeMaintenanceLog({
    id: crypto.randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  });

  const logs = sortMaintenanceLogs([log, ...existing.logs]);
  const profile = syncBikeMileageFromLogs(existing.profile, logs);

  const bikes = current.bikes.map((entry) =>
    entry.id === bikeId ? { ...entry, profile, logs } : entry
  );

  const next: UserBikeGarage = {
    ...current,
    bikes,
    updatedAt: new Date().toISOString(),
  };

  store[userId] = next;
  await writeStore(store);
  return next;
}

export async function updateMaintenanceLog(
  userId: string,
  bikeId: string,
  logId: string,
  input: UpdateMaintenanceLogInput
): Promise<UserBikeGarage | null> {
  const store = await readStore();
  const current = store[userId];
  const existing = current ? findBike(current, bikeId) : undefined;
  if (!current || !existing) return null;

  const index = existing.logs.findIndex((log) => log.id === logId);
  if (index === -1) return null;

  const updated = normalizeMaintenanceLog({
    ...existing.logs[index],
    ...input,
    title:
      input.title != null ? String(input.title).trim() : existing.logs[index].title,
  });

  const logs = [...existing.logs];
  logs[index] = updated;
  const sortedLogs = sortMaintenanceLogs(logs);
  const profile = reconcileLastServiceAfterLogsChange(
    existing.profile,
    existing.logs,
    sortedLogs
  );

  const bikes = current.bikes.map((entry) =>
    entry.id === bikeId ? { ...entry, profile, logs: sortedLogs } : entry
  );

  const next: UserBikeGarage = {
    ...current,
    bikes,
    updatedAt: new Date().toISOString(),
  };

  store[userId] = next;
  await writeStore(store);
  return next;
}

export async function deleteMaintenanceLog(
  userId: string,
  bikeId: string,
  logId: string
): Promise<UserBikeGarage | null> {
  const store = await readStore();
  const current = store[userId];
  const existing = current ? findBike(current, bikeId) : undefined;
  if (!current || !existing) return null;

  const nextLogs = existing.logs.filter((log) => log.id !== logId);
  if (nextLogs.length === existing.logs.length) return null;

  const profile = reconcileLastServiceAfterLogsChange(
    existing.profile,
    existing.logs,
    nextLogs
  );

  const bikes = current.bikes.map((entry) =>
    entry.id === bikeId ? { ...entry, profile, logs: nextLogs } : entry
  );

  const next: UserBikeGarage = {
    ...current,
    bikes,
    updatedAt: new Date().toISOString(),
  };

  store[userId] = next;
  await writeStore(store);
  return next;
}

/** 코스를 실제로 탄 만큼 해당 바이크 누적 주행거리에 더한다. 바이크가 없으면 null. */
export async function addRideDistanceToBike(
  userId: string,
  bikeId: string,
  distanceKm: number
): Promise<UserBikeGarage | null> {
  const store = await readStore();
  const current = store[userId];
  const existing = current ? findBike(current, bikeId) : undefined;
  if (!current || !existing) return null;

  const profile = normalizeBikeProfile({
    ...existing.profile,
    currentMileage: Math.max(
      0,
      Math.round(existing.profile.currentMileage + distanceKm)
    ),
  });

  const bikes = current.bikes.map((entry) =>
    entry.id === bikeId ? { ...entry, profile } : entry
  );

  const next: UserBikeGarage = {
    ...current,
    bikes,
    updatedAt: new Date().toISOString(),
  };

  store[userId] = next;
  await writeStore(store);
  return next;
}

export async function deleteUserBikeGarage(userId: string): Promise<void> {
  const store = await readStore();
  if (!(userId in store)) return;

  delete store[userId];
  await writeStore(store);
}
