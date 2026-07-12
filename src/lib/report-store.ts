import { promises as fs } from "fs";
import path from "path";
import type {
  CreateReportInput,
  Report,
  ReportStatus,
  ReportTargetType,
} from "@/lib/reports";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "reports.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

export async function readReports(): Promise<Report[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as Report[];
}

async function writeReports(reports: Report[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(reports, null, 2), "utf8");
}

export async function createReport(input: CreateReportInput): Promise<Report> {
  const reports = await readReports();

  const duplicate = reports.find(
    (report) =>
      report.reporterId === input.reporterId &&
      report.targetType === input.targetType &&
      report.targetId === input.targetId &&
      report.status === "pending"
  );

  if (duplicate) {
    throw new Error("ALREADY_REPORTED");
  }

  const report: Report = {
    id: crypto.randomUUID(),
    ...input,
    detail: input.detail ?? "",
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  reports.unshift(report);
  await writeReports(reports);
  return report;
}

export async function updateReportStatus(
  id: string,
  status: Exclude<ReportStatus, "pending">,
  adminNote?: string
): Promise<Report | null> {
  const reports = await readReports();
  const index = reports.findIndex((report) => report.id === id);
  if (index === -1) return null;

  reports[index] = {
    ...reports[index],
    status,
    adminNote: adminNote?.trim() || reports[index].adminNote,
    resolvedAt: new Date().toISOString(),
  };

  await writeReports(reports);
  return reports[index];
}

export async function resolveReportsForTarget(
  targetType: ReportTargetType,
  targetId: string,
  adminNote?: string
): Promise<void> {
  const reports = await readReports();
  const now = new Date().toISOString();

  const updated = reports.map((report) => {
    if (
      report.targetType === targetType &&
      report.targetId === targetId &&
      report.status === "pending"
    ) {
      return {
        ...report,
        status: "resolved" as const,
        adminNote: adminNote?.trim() || report.adminNote,
        resolvedAt: now,
      };
    }
    return report;
  });

  await writeReports(updated);
}

export async function getReport(id: string): Promise<Report | null> {
  const reports = await readReports();
  return reports.find((report) => report.id === id) ?? null;
}
