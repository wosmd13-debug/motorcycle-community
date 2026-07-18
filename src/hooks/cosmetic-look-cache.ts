import type { ShopCosmeticLook } from "@/lib/shop";

const cache: Record<string, ShopCosmeticLook> = {};
const inflight = new Set<string>();
const listeners = new Set<() => void>();
let queued = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

async function fetchBatch(nicknames: string[]) {
  if (nicknames.length === 0) return;

  for (const nickname of nicknames) {
    inflight.add(nickname);
  }

  try {
    const response = await fetch("/api/shop/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nicknames }),
    });
    if (!response.ok) return;

    const data = (await response.json()) as {
      looksByNickname?: Record<string, ShopCosmeticLook>;
    };
    const looks = data.looksByNickname ?? {};

    for (const nickname of nicknames) {
      cache[nickname] = looks[nickname] ?? {};
    }
    notify();
  } catch {
    // keep missing entries out of cache so a later retry can refetch
  } finally {
    for (const nickname of nicknames) {
      inflight.delete(nickname);
    }
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    const batch = [...queued].slice(0, 100);
    queued = new Set([...queued].slice(100));
    void fetchBatch(batch);
    if (queued.size > 0) scheduleFlush();
  }, 16);
}

export function ensureCosmeticLooks(nicknames: string[]) {
  const missing = nicknames.filter(
    (nickname) =>
      Boolean(nickname) &&
      !(nickname in cache) &&
      !inflight.has(nickname) &&
      !queued.has(nickname)
  );
  if (missing.length === 0) return;
  for (const nickname of missing) {
    queued.add(nickname);
  }
  scheduleFlush();
}

export function getCachedCosmeticLook(
  nickname: string
): ShopCosmeticLook | undefined {
  return cache[nickname];
}

export function getCachedCosmeticLooks(
  nicknames: string[]
): Record<string, ShopCosmeticLook> {
  const result: Record<string, ShopCosmeticLook> = {};
  for (const nickname of nicknames) {
    if (nickname in cache) {
      result[nickname] = cache[nickname];
    }
  }
  return result;
}

export function subscribeCosmeticLooks(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 구매·장착 후 캐시를 비워 최신 코스메틱을 다시 불러옵니다. */
export function invalidateCosmeticLooks(nicknames?: string[]) {
  if (!nicknames?.length) {
    for (const key of Object.keys(cache)) {
      delete cache[key];
    }
  } else {
    for (const nickname of nicknames) {
      delete cache[nickname];
    }
  }
  notify();
}
