import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isOperatorUser } from "@/lib/admin";
import { findUserById } from "@/lib/user-store";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/session";
import { withAdminFlag } from "@/lib/admin";
import type { PublicUser } from "@/lib/users";

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function getSessionPayloadFromRequest(
  request: NextRequest
): SessionPayload | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

function toSessionUser(user: Awaited<ReturnType<typeof findUserById>>) {
  if (!user) return null;

  return withAdminFlag({
    id: user.id,
    loginId: user.loginId,
    nickname: user.nickname,
    isOperator: user.role === "operator",
  });
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const session = await getSessionPayload();
  if (!session) return null;

  const user = await findUserById(session.userId);
  return toSessionUser(user);
}

export async function getCurrentUserFromRequest(
  request: NextRequest
): Promise<PublicUser | null> {
  const session = getSessionPayloadFromRequest(request);
  if (!session) return null;

  const user = await findUserById(session.userId);
  return toSessionUser(user);
}

export async function requireOperatorFromRequest(
  request: NextRequest
): Promise<PublicUser | NextResponse> {
  const user = await requireCurrentUserFromRequest(request);
  if (user instanceof NextResponse) return user;

  const dbUser = await findUserById(user.id);
  if (!isOperatorUser(dbUser) && !user.isOperator) {
    return NextResponse.json(
      { error: "운영자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  return user;
}

export async function requireAdminFromRequest(
  request: NextRequest
): Promise<PublicUser | NextResponse> {
  const user = await requireCurrentUserFromRequest(request);
  if (user instanceof NextResponse) return user;

  if (!user.isAdmin) {
    return NextResponse.json(
      { error: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  return user;
}

export function setSessionCookie(response: NextResponse, user: PublicUser) {
  const token = createSessionToken(user);
  response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions());
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
}

export async function requireCurrentUserFromRequest(
  request: NextRequest
): Promise<PublicUser | NextResponse> {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }
  return user;
}
