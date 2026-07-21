import { NextResponse } from "next/server";
import { isDirectionsConfigured } from "@/lib/directions-server";

export async function GET() {
  return NextResponse.json({
    configured: isDirectionsConfigured(),
  });
}
