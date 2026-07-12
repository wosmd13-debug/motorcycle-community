import { NextResponse } from "next/server";
import { isOpinetConfigured } from "@/lib/opinet-service";

export async function GET() {
  return NextResponse.json({
    configured: isOpinetConfigured(),
  });
}
