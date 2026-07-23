import { promises as fs } from "fs";
import path from "path";
import type {
  CreateFeedbackInput,
  Feedback,
  FeedbackStatus,
} from "@/lib/feedback";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "feedback.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

export async function readFeedback(): Promise<Feedback[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as Feedback[];
}

async function writeFeedback(entries: Feedback[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), "utf8");
}

export async function createFeedback(
  input: CreateFeedbackInput
): Promise<Feedback> {
  const entries = await readFeedback();

  const entry: Feedback = {
    id: crypto.randomUUID(),
    ...input,
    pageUrl: input.pageUrl?.trim() || undefined,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  entries.unshift(entry);
  await writeFeedback(entries);
  return entry;
}

export async function updateFeedbackStatus(
  id: string,
  status: Exclude<FeedbackStatus, "pending">,
  adminNote?: string
): Promise<Feedback | null> {
  const entries = await readFeedback();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return null;

  entries[index] = {
    ...entries[index],
    status,
    adminNote: adminNote?.trim() || entries[index].adminNote,
    resolvedAt: new Date().toISOString(),
  };

  await writeFeedback(entries);
  return entries[index];
}
