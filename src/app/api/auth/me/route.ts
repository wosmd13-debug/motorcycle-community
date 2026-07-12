import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "세션을 확인하지 못했습니다." },
      { status: 500 }
    );
  }
}
