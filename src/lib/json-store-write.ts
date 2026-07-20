import { access, constants, mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export type DataStoreHealth = {
  dir: string;
  exists: boolean;
  writable: boolean;
  error?: string;
};

export async function checkDataStoreHealth(): Promise<DataStoreHealth> {
  const dir = DATA_DIR;
  try {
    await mkdir(dir, { recursive: true });
    await access(dir, constants.W_OK);
    const probe = path.join(dir, ".write-probe");
    await writeFile(probe, "ok", "utf8");
    await unlink(probe);
    return { dir, exists: true, writable: true };
  } catch (error) {
    return {
      dir,
      exists: true,
      writable: false,
      error: error instanceof Error ? error.message : "unknown",
    };
  }
}

/** JSON 파일 원자적 저장 */
export async function writeJsonFileAtomic(
  filePath: string,
  data: unknown
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  const payload = `${JSON.stringify(data, null, 2)}\n`;

  try {
    await writeFile(tmpPath, payload, { mode: 0o664, encoding: "utf8" });
    await writeFile(filePath, payload, { mode: 0o664, encoding: "utf8" });
  } finally {
    try {
      await unlink(tmpPath);
    } catch {
      // ignore cleanup errors
    }
  }
}

export function isPermissionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as NodeJS.ErrnoException).code;
  return code === "EACCES" || code === "EPERM" || code === "EROFS";
}
