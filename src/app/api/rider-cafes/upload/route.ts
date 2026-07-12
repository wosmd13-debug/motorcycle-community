import { NextRequest } from "next/server";
import { handleAuthenticatedImageUpload } from "@/lib/upload-service";

export async function POST(request: NextRequest) {
  return handleAuthenticatedImageUpload(request, "rider-cafes");
}
