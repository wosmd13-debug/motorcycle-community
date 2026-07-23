"use client";

import { useCallback, useEffect, useState } from "react";
import {
  feedbackCategoryLabels,
  formatFeedbackDate,
  type Feedback,
} from "@/lib/feedback";

type AdminFeedbackExplorerProps = {
  initialFeedback: Feedback[];
};

export default function AdminFeedbackExplorer({
  initialFeedback,
}: AdminFeedbackExplorerProps) {
  const [entries, setEntries] = useState(initialFeedback);
  const [filter, setFilter] = useState<
    "all" | "pending" | "resolved" | "dismissed"
  >("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const query = filter === "all" ? "" : `?status=${filter}`;
    const response = await fetch(`/api/feedback${query}`);
    const data = await response.json();
    if (response.ok) {
      setEntries(data.feedback as Feedback[]);
    }
  }, [filter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleAction = async (
    id: string,
    action: "resolve" | "dismiss"
  ) => {
    setProcessingId(id);
    setError(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error((data.error as string) ?? "처리에 실패했습니다.");
      }

      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "처리에 실패했습니다.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredEntries =
    filter === "all"
      ? entries
      : entries.filter((entry) => entry.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["pending", "대기"],
            ["resolved", "처리완료"],
            ["dismissed", "기각"],
            ["all", "전체"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === value
                ? "bg-signature text-white"
                : "bg-signature-light text-stone-600 ring-1 ring-signature/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {filteredEntries.length === 0 ? (
        <div className="portal-panel px-6 py-12 text-center text-sm text-stone-500">
          {filter === "pending"
            ? "대기 중인 건의·문의가 없습니다."
            : "표시할 건의·문의가 없습니다."}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <article key={entry.id} className="portal-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-signature-light px-2.5 py-0.5 text-[11px] font-semibold text-signature-dark">
                      {feedbackCategoryLabels[entry.category]}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        entry.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : entry.status === "resolved"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-stone-200 text-stone-700"
                      }`}
                    >
                      {entry.status === "pending"
                        ? "대기"
                        : entry.status === "resolved"
                          ? "처리완료"
                          : "기각"}
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-bold text-stone-800">
                    {entry.title}
                  </h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-600">
                    {entry.message}
                  </p>
                  <p className="mt-3 text-xs text-stone-500">
                    {entry.nickname} · {entry.contactEmail} ·{" "}
                    {formatFeedbackDate(entry.createdAt)}
                  </p>
                  {entry.pageUrl && (
                    <p className="mt-1 break-all text-xs text-stone-500">
                      페이지: {entry.pageUrl}
                    </p>
                  )}
                </div>

                {entry.status === "pending" && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleAction(entry.id, "resolve")}
                      disabled={processingId === entry.id}
                      className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      처리완료
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleAction(entry.id, "dismiss")}
                      disabled={processingId === entry.id}
                      className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-60"
                    >
                      기각
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
