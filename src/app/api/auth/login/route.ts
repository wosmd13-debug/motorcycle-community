import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth-server";
import { withAdminFlag } from "@/lib/admin";
import { rateLimitAuthAttempt } from "@/lib/request-guards";
import { authenticateUser } from "@/lib/user-store";

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimitAuthAttempt(request, "login");
    if (limited) return limited;

    const body = await request.json();
    const loginId = String(body.loginId ?? "");
    const password = String(body.password ?? "");

    if (!loginId || !password) {
      return NextResponse.json(
        { error: "아이디와 비밀번호를 입력해 주세요." },
        { status: 400 }
      );
    }

    const result = await authenticateUser(loginId, password);
    if (result.error || !result.user) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const publicUser = withAdminFlag(result.user);
    const response = NextResponse.json({ user: publicUser });
    setSessionCookie(response, publicUser);
    return response;
  } catch {
    return NextResponse.json(
      { error: "로그인에 실패했습니다." },
      { status: 500 }
    );
  }
}
