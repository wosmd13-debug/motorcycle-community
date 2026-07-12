import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth-server";
import { withAdminFlag } from "@/lib/admin";
import { rateLimitAuthAttempt } from "@/lib/request-guards";
import { registerUser } from "@/lib/user-store";

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimitAuthAttempt(request, "register");
    if (limited) return limited;

    const body = await request.json();
    const loginId = String(body.loginId ?? "");
    const nickname = String(body.nickname ?? "");
    const password = String(body.password ?? "");

    const result = await registerUser({ loginId, nickname, password });
    if (result.error || !result.user) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const publicUser = withAdminFlag(result.user);
    const response = NextResponse.json({ user: publicUser }, { status: 201 });
    setSessionCookie(response, publicUser);
    return response;
  } catch {
    return NextResponse.json(
      { error: "회원가입에 실패했습니다." },
      { status: 500 }
    );
  }
}
