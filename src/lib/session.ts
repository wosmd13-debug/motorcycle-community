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

const WEAK_AUTH_SECRETS = new Set([
  "dev-only-auth-secret-change-me",
  "dev-local-auth-secret-change-me",
  "운영환경에서_긴_랜덤_문자열로_변경하세요",
  "change-me",
  "secret",
]);

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (process.env.NODE_ENV === "production") {
    if (!secret) {
      throw new Error("AUTH_SECRET 환경 변수가 필요합니다.");
    }
    if (secret.length < 32 || WEAK_AUTH_SECRETS.has(secret)) {
      throw new Error(
        "AUTH_SECRET 은 32자 이상의 난수로 설정하세요. 예시/개발용 값은 사용할 수 없습니다."
      );
    }
    return secret;
  }
  if (secret) return secret;
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
  const options: {
    httpOnly: boolean;
    sameSite: "lax";
    secure: boolean;
    path: string;
    maxAge: number;
    domain?: string;
  } = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };

  if (process.env.NODE_ENV === "production") {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (siteUrl) {
      try {
        const hostname = new URL(siteUrl).hostname;
        if (hostname && !hostname.includes("localhost")) {
          const parts = hostname.replace(/^www\./, "").split(".");
          if (parts.length >= 2) {
            options.domain = `.${parts.slice(-2).join(".")}`;
          }
        }
      } catch {
        // ignore invalid site url
      }
    }
  }

  return options;
}
