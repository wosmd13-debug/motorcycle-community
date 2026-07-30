"use client";

import { useEffect, useRef } from "react";

type ViewRecordResult =
  | { ok: true; views: number }
  | { ok: false; rateLimited?: boolean };

const inflightViews = new Map<string, Promise<ViewRecordResult>>();

type UseContentViewOptions = {
  contentId: string;
  storagePrefix: string;
  apiPath: string;
  onViews: (views: number) => void;
  onError?: (message: string) => void;
};

function extractViews(data: Record<string, unknown>): number | null {
  for (const key of ["post", "item", "video", "entry"]) {
    const value = data[key];
    if (value && typeof value === "object" && "views" in value) {
      const views = Number((value as { views?: number }).views);
      if (!Number.isNaN(views)) return views;
    }
  }
  return null;
}

async function patchViewOnce(apiPath: string): Promise<ViewRecordResult> {
  const response = await fetch(apiPath, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify({ action: "view" }),
  });
  const data = (await response.json()) as Record<string, unknown>;

  if (response.status === 429) {
    return { ok: false, rateLimited: true };
  }

  if (!response.ok) {
    return { ok: false };
  }

  const views = extractViews(data);
  if (views == null) return { ok: false };

  return { ok: true, views };
}

function recordContentView(viewKey: string, apiPath: string): Promise<ViewRecordResult> {
  if (sessionStorage.getItem(viewKey) === "1") {
    return Promise.resolve({ ok: false });
  }

  const existing = inflightViews.get(viewKey);
  if (existing) return existing;

  const promise = (async (): Promise<ViewRecordResult> => {
    try {
      let result = await patchViewOnce(apiPath);

      if (!result.ok && result.rateLimited) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (sessionStorage.getItem(viewKey) === "1") {
          return { ok: false };
        }
        result = await patchViewOnce(apiPath);
      }

      if (result.ok) {
        sessionStorage.setItem(viewKey, "1");
      }

      return result;
    } catch {
      return { ok: false };
    } finally {
      inflightViews.delete(viewKey);
    }
  })();

  inflightViews.set(viewKey, promise);
  return promise;
}

export function useContentView({
  contentId,
  storagePrefix,
  apiPath,
  onViews,
  onError,
}: UseContentViewOptions) {
  const onViewsRef = useRef(onViews);
  const onErrorRef = useRef(onError);

  onViewsRef.current = onViews;
  onErrorRef.current = onError;

  useEffect(() => {
    const viewKey = `${storagePrefix}-${contentId}`;
    let cancelled = false;

    void recordContentView(viewKey, apiPath).then((result) => {
      if (cancelled) return;

      if (result.ok) {
        onViewsRef.current(result.views);
        return;
      }

      if (result.rateLimited) {
        onErrorRef.current?.(
          "조회수를 반영하지 못했습니다. 잠시 후 다시 열어 주세요."
        );
        return;
      }

      if (sessionStorage.getItem(viewKey) !== "1") {
        onErrorRef.current?.("조회수를 반영하지 못했습니다.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [contentId, storagePrefix, apiPath]);
}
