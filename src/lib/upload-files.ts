import { promises as fs } from "fs";
import path from "path";

/**
 * /uploads/... 경로만 삭제. 외부 URL·경로 조작은 무시합니다.
 */
export async function deleteUploadedPublicUrls(
  urls: Array<string | null | undefined>
): Promise<void> {
  const unique = [...new Set(urls.filter((url): url is string => Boolean(url)))];

  await Promise.all(
    unique.map(async (url) => {
      if (!url.startsWith("/uploads/")) return;
      if (url.includes("..") || url.includes("\\")) return;

      const relative = url.replace(/^\/+/, "");
      const filePath = path.join(process.cwd(), "public", relative);
      const uploadsRoot = path.join(process.cwd(), "public", "uploads");
      const resolved = path.resolve(filePath);
      if (!resolved.startsWith(path.resolve(uploadsRoot))) return;

      try {
        await fs.unlink(resolved);
      } catch {
        // 파일이 없어도 삭제는 성공으로 간주
      }
    })
  );
}

export type DetectedImageMime = "image/jpeg" | "image/png" | "image/webp";

/** 매직 바이트로 실제 이미지 형식 판별 */
export function detectImageMime(buffer: Buffer): DetectedImageMime | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}
