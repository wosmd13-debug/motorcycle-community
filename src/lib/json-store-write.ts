import { access, constants, mkdir, open, rename, unlink, writeFile } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const GALLERY_FILE = path.join(DATA_DIR, "gallery.json");

export type DataStoreHealth = {
  dir: string;
  exists: boolean;
  writable: boolean;
  galleryWritable: boolean;
  error?: string;
};

async function canWriteJsonStoreFile(filePath: string): Promise<boolean> {
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    const handle = await open(filePath, "a");
    await handle.close();
    return true;
  } catch {
    return false;
  }
}

export async function checkDataStoreHealth(): Promise<DataStoreHealth> {
  const dir = DATA_DIR;
  try {
    await mkdir(dir, { recursive: true });
    await access(dir, constants.W_OK);

    const galleryWritable = await canWriteJsonStoreFile(GALLERY_FILE);
    if (!galleryWritable) {
      return {
        dir,
        exists: true,
        writable: false,
        galleryWritable: false,
        error: "gallery.json 쓰기 불가 (파일 권한 문제)",
      };
    }

    return { dir, exists: true, writable: true, galleryWritable: true };
  } catch (error) {
    return {
      dir,
      exists: true,
      writable: false,
      galleryWritable: false,
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

  await writeFile(tmpPath, payload, { mode: 0o664, encoding: "utf8" });
  try {
    await rename(tmpPath, filePath);
  } catch (error) {
    try {
      await unlink(tmpPath);
    } catch {
      // ignore cleanup errors
    }
    throw error;
  }
}

export function isPermissionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as NodeJS.ErrnoException).code;
  return code === "EACCES" || code === "EPERM" || code === "EROFS";
}
