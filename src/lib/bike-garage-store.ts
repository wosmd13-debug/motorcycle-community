import { promises as fs } from "fs";
import path from "path";
import {
  createEmptyBikeProfile,
  normalizeBikeProfile,
  normalizeMaintenanceLog,
  reconcileLastServiceAfterLogsChange,
  serviceIntervalKeys,
  sortMaintenanceLogs,
  syncBikeMileageFromLogs,
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

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "{}", "utf8");
  }
}

async function readStore(): Promise<GarageStore> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as GarageStore;
}

async function writeStore(store: GarageStore) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

function emptyGarage(userId: string): UserBikeGarage {
  return {
    userId,
    bike: null,
    logs: [],
    updatedAt: new Date().toISOString(),
  };
}

export async function getUserBikeGarage(userId: string): Promise<UserBikeGarage> {
  const store = await readStore();
  const garage = store[userId];
  if (!garage) return emptyGarage(userId);

  return {
    ...garage,
    bike: garage.bike ? normalizeBikeProfile(garage.bike) : null,
    logs: sortMaintenanceLogs(garage.logs.map(normalizeMaintenanceLog)),
  };
}

export async function updateUserBikeProfile(
  userId: string,
  input: Partial<Omit<BikeProfile, "lastServiceAt">> & {
    model: string;
    lastServiceAt?: Partial<Record<ServiceIntervalKey, number | null>>;
  }
): Promise<UserBikeGarage> {
  const store = await readStore();
  const current = store[userId] ?? emptyGarage(userId);
  const base = current.bike ?? createEmptyBikeProfile();

  const lastServiceAt: Partial<Record<ServiceIntervalKey, number>> = {
    ...base.lastServiceAt,
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

  const bike = syncBikeMileageFromLogs(
    normalizeBikeProfile({
      ...base,
      ...input,
      model: input.model.trim(),
      year: input.year != null ? Number(input.year) : undefined,
      currentMileage: Math.max(0, Number(input.currentMileage ?? base.currentMileage)),
      serviceIntervals: {
        ...base.serviceIntervals,
        ...input.serviceIntervals,
      },
      lastServiceAt,
    }),
    current.logs
  );

  const next: UserBikeGarage = {
    ...current,
    bike,
    updatedAt: new Date().toISOString(),
  };

  store[userId] = next;
  await writeStore(store);
  return next;
}

export async function addMaintenanceLog(
  userId: string,
  input: CreateMaintenanceLogInput
): Promise<UserBikeGarage> {
  const store = await readStore();
  const current = store[userId] ?? emptyGarage(userId);

  const log: MaintenanceLog = normalizeMaintenanceLog({
    id: crypto.randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  });

  const logs = sortMaintenanceLogs([log, ...current.logs]);
  const bike = current.bike
    ? syncBikeMileageFromLogs(current.bike, logs)
    : null;

  const next: UserBikeGarage = {
    ...current,
    bike,
    logs,
    updatedAt: new Date().toISOString(),
  };

  store[userId] = next;
  await writeStore(store);
  return next;
}

export async function updateMaintenanceLog(
  userId: string,
  logId: string,
  input: UpdateMaintenanceLogInput
): Promise<UserBikeGarage | null> {
  const store = await readStore();
  const current = store[userId];
  if (!current) return null;

  const index = current.logs.findIndex((log) => log.id === logId);
  if (index === -1) return null;

  const updated = normalizeMaintenanceLog({
    ...current.logs[index],
    ...input,
    title:
      input.title != null ? String(input.title).trim() : current.logs[index].title,
  });

  const logs = [...current.logs];
  logs[index] = updated;
  const sortedLogs = sortMaintenanceLogs(logs);
  const bike = current.bike
    ? reconcileLastServiceAfterLogsChange(current.bike, current.logs, sortedLogs)
    : null;

  const next: UserBikeGarage = {
    ...current,
    bike,
    logs: sortedLogs,
    updatedAt: new Date().toISOString(),
  };

  store[userId] = next;
  await writeStore(store);
  return next;
}

export async function deleteMaintenanceLog(
  userId: string,
  logId: string
): Promise<UserBikeGarage | null> {
  const store = await readStore();
  const current = store[userId];
  if (!current) return null;

  const nextLogs = current.logs.filter((log) => log.id !== logId);
  if (nextLogs.length === current.logs.length) return null;
  const bike = current.bike
    ? reconcileLastServiceAfterLogsChange(current.bike, current.logs, nextLogs)
    : null;

  const next: UserBikeGarage = {
    ...current,
    bike,
    logs: nextLogs,
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
