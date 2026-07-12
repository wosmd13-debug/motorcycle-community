import { promises as fs } from "fs";
import path from "path";
import {
  normalizeMeetup,
  seedMeetups,
  type CreateMeetupInput,
  type MeetupEntry,
  type MeetupParticipant,
  type UpdateMeetupInput,
} from "@/lib/meetup";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "meetups.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(seedMeetups, null, 2),
      "utf8"
    );
  }
}

export async function readMeetups(): Promise<MeetupEntry[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const entries = JSON.parse(raw) as MeetupEntry[];
  const normalized = entries.map(normalizeMeetup);

  const needsMigration = entries.some(
    (entry) =>
      entry.participants == null ||
      entry.views == null ||
      entry.cancelled == null
  );

  if (needsMigration) {
    await writeMeetups(normalized);
  }

  return normalized;
}

async function writeMeetups(entries: MeetupEntry[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), "utf8");
}

export async function createMeetup(input: CreateMeetupInput): Promise<MeetupEntry> {
  const entries = await readMeetups();
  const entry: MeetupEntry = normalizeMeetup({
    id: crypto.randomUUID(),
    ...input,
    maxParticipants: input.maxParticipants ?? null,
    participants: [],
    cancelled: false,
    views: 0,
    createdAt: new Date().toISOString(),
  });

  entries.unshift(entry);
  await writeMeetups(entries);
  return entry;
}

export async function getMeetup(id: string): Promise<MeetupEntry | null> {
  const entries = await readMeetups();
  return entries.find((entry) => entry.id === id) ?? null;
}

export async function viewMeetup(id: string): Promise<MeetupEntry | null> {
  const entries = await readMeetups();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return null;

  entries[index] = { ...entries[index], views: entries[index].views + 1 };
  await writeMeetups(entries);
  return entries[index];
}

export async function joinMeetup(
  id: string,
  participant: Pick<MeetupParticipant, "userId" | "nickname">
): Promise<MeetupEntry | null> {
  const entries = await readMeetups();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return null;

  const entry = entries[index];
  if (entry.participants.some((item) => item.userId === participant.userId)) {
    return entry;
  }

  if (entry.maxParticipants != null && entry.participants.length >= entry.maxParticipants) {
    return null;
  }

  const nextParticipant: MeetupParticipant = {
    ...participant,
    joinedAt: new Date().toISOString(),
  };

  entries[index] = {
    ...entry,
    participants: [...entry.participants, nextParticipant],
  };

  await writeMeetups(entries);
  return entries[index];
}

export async function leaveMeetup(
  id: string,
  userId: string
): Promise<MeetupEntry | null> {
  const entries = await readMeetups();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return null;

  entries[index] = {
    ...entries[index],
    participants: entries[index].participants.filter(
      (participant) => participant.userId !== userId
    ),
  };

  await writeMeetups(entries);
  return entries[index];
}

export async function updateMeetup(
  id: string,
  input: UpdateMeetupInput
): Promise<MeetupEntry | null> {
  const entries = await readMeetups();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return null;

  entries[index] = normalizeMeetup({
    ...entries[index],
    ...input,
    maxParticipants:
      input.maxParticipants !== undefined
        ? input.maxParticipants
        : entries[index].maxParticipants,
  });

  await writeMeetups(entries);
  return entries[index];
}

export async function deleteMeetup(id: string): Promise<boolean> {
  const entries = await readMeetups();
  const next = entries.filter((entry) => entry.id !== id);
  if (next.length === entries.length) return false;

  await writeMeetups(next);
  return true;
}
