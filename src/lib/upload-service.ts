import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserFromRequest } from "@/lib/auth-server";
import {
  checkRateLimit,
  clientKeyFromRequest,
} from "@/lib/rate-limit";
import { detectImageMime } from "@/lib/upload-files";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const UPLOADS_PER_HOUR = 40;

export type UploadFolder =
  | "board"
  | "gallery"
  | "marketplace"
  | "rider-cafes";

/**
 * 로그인 필수 이미지 업로드. 용량·형식·매직바이트를 검사합니다.
 */
export async function handleAuthenticatedImageUpload(
  request: NextRequest,
  folder: UploadFolder
): Promise<NextResponse> {
  try {
    const user = await requireCurrentUserFromRequest(request);
    if (user instanceof NextResponse) return user;

    const limit = checkRateLimit(
      clientKeyFromRequest(request, `upload:${folder}`, user.id),
      UPLOADS_PER_HOUR,
      60 * 60 * 1000
    );
    if (!limit.ok) {
      return NextResponse.json(
        {
          error: `업로드가 너무 많습니다. ${limit.retryAfterSec}초 후 다시 시도해 주세요.`,
        },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "업로드할 이미지 파일이 필요합니다." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 5MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = detectImageMime(buffer);
    if (!detected || !ALLOWED_TYPES.has(detected)) {
      return NextResponse.json(
        { error: "JPG, PNG, WEBP 형식만 업로드할 수 있습니다." },
        { status: 400 }
      );
    }

    // 클라이언트가 보낸 MIME과 실제 내용이 다르면 실제 내용 기준으로 저장
    const mime = detected;
    const extension = mime.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    const filePath = path.join(uploadDir, filename);

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({
      imageUrl: `/uploads/${folder}/${filename}`,
    });
  } catch {
    return NextResponse.json(
      { error: "이미지 업로드에 실패했습니다." },
      { status: 500 }
    );
  }
}
