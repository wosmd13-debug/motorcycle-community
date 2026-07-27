"use client";

import { useEffect, useRef } from "react";

const inflight = new Set<string>();

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

    async function recordView() {
      if (sessionStorage.getItem(viewKey) === "1") return;
      if (inflight.has(viewKey)) return;

      inflight.add(viewKey);

      try {
        const response = await fetch(apiPath, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "view" }),
        });
        const data = (await response.json()) as Record<string, unknown>;

        if (cancelled) return;

        if (!response.ok) {
          onErrorRef.current?.(
            (data.error as string | undefined) ?? "조회수를 반영하지 못했습니다."
          );
          return;
        }

        const views = extractViews(data);
        if (views == null) return;

        sessionStorage.setItem(viewKey, "1");
        onViewsRef.current(views);
      } catch {
        if (!cancelled) {
          onErrorRef.current?.("조회수를 반영하지 못했습니다.");
        }
      } finally {
        inflight.delete(viewKey);
      }
    }

    void recordView();

    return () => {
      cancelled = true;
    };
  }, [contentId, storagePrefix, apiPath]);
}
