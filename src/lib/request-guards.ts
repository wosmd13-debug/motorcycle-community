import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserFromRequest } from "@/lib/auth-server";
import {
  checkRateLimit,
  clientKeyFromRequest,
} from "@/lib/rate-limit";
import type { PublicUser } from "@/lib/users";

const LIKE_LIMIT = 60;
const VOTE_LIMIT = 80;
const VIEW_LIMIT = 120;
const AUTH_LIMIT = 20;
const WRITE_LIMIT = 40;
const COMMENT_LIMIT = 80;
const REPORT_LIMIT = 20;
const EXTERNAL_API_LIMIT = 90;
const WINDOW_MS = 60 * 60 * 1000;
const AUTH_WINDOW_MS = 15 * 60 * 1000;

type RateLimitedAction =
  | "like"
  | "comment-vote"
  | "upload"
  | "write"
  | "comment"
  | "report";

function limitForAction(action: RateLimitedAction): number {
  switch (action) {
    case "like":
      return LIKE_LIMIT;
    case "comment-vote":
      return VOTE_LIMIT;
    case "upload":
      return 40;
    case "write":
      return WRITE_LIMIT;
    case "comment":
      return COMMENT_LIMIT;
    case "report":
      return REPORT_LIMIT;
  }
}

export async function requireUserWithRateLimit(
  request: NextRequest,
  action: RateLimitedAction
): Promise<PublicUser | NextResponse> {
  const user = await requireCurrentUserFromRequest(request);
  if (user instanceof NextResponse) return user;

  const result = checkRateLimit(
    clientKeyFromRequest(request, action, user.id),
    limitForAction(action),
    WINDOW_MS
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        error: `요청이 너무 많습니다. ${result.retryAfterSec}초 후 다시 시도해 주세요.`,
      },
      { status: 429 }
    );
  }

  return user;
}

/** 날씨·경로·유가 등 외부 API 호출 보호 */
export function rateLimitExternalApi(
  request: NextRequest,
  kind: "weather" | "directions" | "fuel"
): NextResponse | null {
  const result = checkRateLimit(
    clientKeyFromRequest(request, kind),
    EXTERNAL_API_LIMIT,
    WINDOW_MS
  );
  if (!result.ok) {
    return NextResponse.json(
      {
        error: `요청이 너무 많습니다. ${result.retryAfterSec}초 후 다시 시도해 주세요.`,
      },
      { status: 429 }
    );
  }
  return null;
}

export function rateLimitAuthAttempt(
  request: NextRequest,
  kind: "login" | "register"
): NextResponse | null {
  const result = checkRateLimit(
    clientKeyFromRequest(request, kind),
    AUTH_LIMIT,
    AUTH_WINDOW_MS
  );
  if (!result.ok) {
    return NextResponse.json(
      {
        error: `시도가 너무 많습니다. ${result.retryAfterSec}초 후 다시 시도해 주세요.`,
      },
      { status: 429 }
    );
  }
  return null;
}

export function rateLimitAnonymousView(
  request: NextRequest
): NextResponse | null {
  const result = checkRateLimit(
    clientKeyFromRequest(request, "view"),
    VIEW_LIMIT,
    WINDOW_MS
  );
  if (!result.ok) {
    return NextResponse.json(
      {
        error: `조회 요청이 너무 많습니다. ${result.retryAfterSec}초 후 다시 시도해 주세요.`,
      },
      { status: 429 }
    );
  }
  return null;
}

export function parseCommentVoteChoice(body: {
  choice?: unknown;
  up?: unknown;
  down?: unknown;
}): "up" | "down" | null {
  const choice = String(body.choice ?? "").trim();
  if (choice === "up" || choice === "down") return choice;

  // 구 클라이언트 호환: ± 숫자만 허용 (±1)
  const up = Number(body.up ?? 0);
  const down = Number(body.down ?? 0);
  if (![ -1, 0, 1 ].includes(up) || ![ -1, 0, 1 ].includes(down)) {
    return null;
  }
  if (up === 1 && down <= 0) return "up";
  if (down === 1 && up <= 0) return "down";
  return null;
}
