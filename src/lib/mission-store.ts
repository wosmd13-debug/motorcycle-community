import { promises as fs } from "fs";
import path from "path";
import type {
  MissionCheckIn,
  MissionClaim,
  MissionId,
  MissionLikeEvent,
  MissionsFileData,
} from "@/lib/missions";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "missions.json");

const emptyData = (): MissionsFileData => ({
  claims: [],
  checkIns: [],
  likeEvents: [],
});

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(emptyData(), null, 2), "utf8");
  }
}

export async function readMissionsData(): Promise<MissionsFileData> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw) as Partial<MissionsFileData>;
  return {
    claims: Array.isArray(parsed.claims) ? parsed.claims : [],
    checkIns: Array.isArray(parsed.checkIns) ? parsed.checkIns : [],
    likeEvents: Array.isArray(parsed.likeEvents) ? parsed.likeEvents : [],
  };
}

async function writeMissionsData(data: MissionsFileData) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function getUserMissionClaims(
  userId: string
): Promise<MissionClaim[]> {
  const data = await readMissionsData();
  return data.claims.filter((claim) => claim.userId === userId);
}

export async function getUserCheckIns(userId: string): Promise<MissionCheckIn[]> {
  const data = await readMissionsData();
  return data.checkIns.filter((item) => item.userId === userId);
}

export async function hasClaim(
  userId: string,
  missionId: MissionId,
  periodKey: string
): Promise<boolean> {
  const data = await readMissionsData();
  return data.claims.some(
    (claim) =>
      claim.userId === userId &&
      claim.missionId === missionId &&
      claim.periodKey === periodKey
  );
}

export async function addMissionCheckIn(
  userId: string,
  dateKey: string
): Promise<MissionCheckIn> {
  const data = await readMissionsData();
  const existing = data.checkIns.find(
    (item) => item.userId === userId && item.dateKey === dateKey
  );
  if (existing) return existing;

  const checkIn: MissionCheckIn = {
    userId,
    dateKey,
    createdAt: new Date().toISOString(),
  };
  data.checkIns.push(checkIn);
  await writeMissionsData(data);
  return checkIn;
}

export async function addMissionClaim(input: {
  userId: string;
  missionId: MissionId;
  periodKey: string;
  points: number;
}): Promise<MissionClaim> {
  const data = await readMissionsData();
  const duplicate = data.claims.find(
    (claim) =>
      claim.userId === input.userId &&
      claim.missionId === input.missionId &&
      claim.periodKey === input.periodKey
  );
  if (duplicate) return duplicate;

  const claim: MissionClaim = {
    id: crypto.randomUUID(),
    userId: input.userId,
    missionId: input.missionId,
    periodKey: input.periodKey,
    points: input.points,
    claimedAt: new Date().toISOString(),
  };
  data.claims.push(claim);
  await writeMissionsData(data);
  return claim;
}

export async function addMissionLikeEvent(userId: string): Promise<MissionLikeEvent> {
  const data = await readMissionsData();
  const event: MissionLikeEvent = {
    id: crypto.randomUUID(),
    userId,
    createdAt: new Date().toISOString(),
  };
  data.likeEvents.push(event);
  if (data.likeEvents.length > 5000) {
    data.likeEvents = data.likeEvents.slice(-5000);
  }
  await writeMissionsData(data);
  return event;
}

export async function countMissionLikesInRange(
  userId: string,
  start: Date,
  end: Date
): Promise<number> {
  const data = await readMissionsData();
  return data.likeEvents.filter((event) => {
    if (event.userId !== userId) return false;
    const time = new Date(event.createdAt).getTime();
    return time >= start.getTime() && time <= end.getTime();
  }).length;
}

export async function sumMissionPointsByUser(): Promise<Map<string, number>> {
  const data = await readMissionsData();
  const map = new Map<string, number>();
  for (const claim of data.claims) {
    map.set(claim.userId, (map.get(claim.userId) ?? 0) + claim.points);
  }
  return map;
}
