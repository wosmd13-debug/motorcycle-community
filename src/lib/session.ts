import { createHmac, timingSafeEqual } from "crypto";
import type { PublicUser } from "@/lib/users";

export const SESSION_COOKIE = "bc_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export type SessionPayload = {
  userId: string;
  loginId: string;
  nickname: string;
  exp: number;
};

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET 환경 변수가 필요합니다.");
  }
  return "dev-only-auth-secret-change-me";
}

function sign(value: string): string {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

export function createSessionToken(user: PublicUser): string {
  const payload: SessionPayload = {
    userId: user.id,
    loginId: user.loginId,
    nickname: user.nickname,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as SessionPayload;

    if (
      !payload.userId ||
      !payload.loginId ||
      !payload.nickname ||
      !payload.exp
    ) {
      return null;
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}
