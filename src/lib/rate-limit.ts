/**
 * 단일 VPS/프로세스용 인메모리 rate limit.
 * 멀티 인스턴스에서는 인스턴스별로 따로 동작합니다.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: Math.max(0, limit - 1) };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { ok: true, remaining: Math.max(0, limit - current.count) };
}

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function clientKeyFromRequest(
  request: Request,
  suffix: string,
  userId?: string
): string {
  const ip = clientIpFromRequest(request);
  return userId ? `${suffix}:user:${userId}` : `${suffix}:ip:${ip}`;
}

/** 조회수 집계용 키 — 로그인 계정 또는 비로그인 IP */
export function viewViewerKeyFromRequest(
  request: Request,
  userId?: string | null
): string {
  if (userId) return userId;
  return `guest:${clientIpFromRequest(request)}`;
}
