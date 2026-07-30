import { NextRequest } from "next/server";
import {
  BOARD_MAX_IMAGE_BYTES,
  formatBoardMaxImageSizeMb,
} from "@/lib/board-upload-limits";
import { handleAuthenticatedImageUpload } from "@/lib/upload-service";

export async function POST(request: NextRequest) {
  return handleAuthenticatedImageUpload(request, "board", {
    maxBytes: BOARD_MAX_IMAGE_BYTES,
    maxSizeError: `파일 크기는 ${formatBoardMaxImageSizeMb()}MB 이하여야 합니다.`,
  });
}
