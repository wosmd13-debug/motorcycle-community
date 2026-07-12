"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatReportDate,
  reportTargetLabels,
  type Report,
} from "@/lib/reports";

type AdminReportsExplorerProps = {
  initialReports: Report[];
};

export default function AdminReportsExplorer({
  initialReports,
}: AdminReportsExplorerProps) {
  const router = useRouter();
  const [reports, setReports] = useState(initialReports);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved" | "dismissed">(
    "pending"
  );
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const query = filter === "all" ? "" : `?status=${filter}`;
    const response = await fetch(`/api/reports${query}`);
    const data = await response.json();
    if (response.ok) {
      setReports(data.reports as Report[]);
    }
  }, [filter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleDismiss = async (id: string) => {
    setProcessingId(id);
    setError(null);

    try {
      const response = await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "dismiss" }),
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

  const handleDeleteContent = async (report: Report) => {
    const confirmed = window.confirm(
      `"${report.targetTitle}" 게시물을 삭제하시겠습니까?\n관련 신고는 모두 처리 완료로 표시됩니다.`
    );
    if (!confirmed) return;

    setProcessingId(report.id);
    setError(null);

    try {
      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: report.targetType,
          targetId: report.targetId,
          adminNote: "신고 검토 후 게시물 삭제",
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error((data.error as string) ?? "삭제에 실패했습니다.");
      }

      await refresh();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredReports =
    filter === "all"
      ? reports
      : reports.filter((report) => report.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["pending", "대기"],
            ["all", "전체"],
            ["resolved", "처리완료"],
            ["dismissed", "기각"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`px-4 py-2 text-sm font-semibold ${
              filter === value
                ? "bg-signature text-white"
                : "border border-signature/20 bg-white text-stone-600 hover:bg-signature-light"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {filteredReports.length === 0 ? (
        <p className="portal-panel px-6 py-12 text-center text-sm text-stone-500">
          {filter === "pending"
            ? "대기 중인 신고가 없습니다."
            : "표시할 신고가 없습니다."}
        </p>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <article key={report.id} className="portal-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="portal-badge">
                      {reportTargetLabels[report.targetType]}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        report.status === "pending"
                          ? "text-red-600"
                          : report.status === "resolved"
                            ? "text-emerald-600"
                            : "text-stone-500"
                      }`}
                    >
                      {report.status === "pending"
                        ? "대기"
                        : report.status === "resolved"
                          ? "처리완료"
                          : "기각"}
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-bold text-stone-800">
                    {report.targetTitle}
                  </h2>
                  <p className="mt-1 text-sm text-stone-600">
                    사유: <strong>{report.reason}</strong>
                  </p>
                  {report.detail && (
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {report.detail}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-stone-400">
                    신고자 {report.reporterNickname} ·{" "}
                    {formatReportDate(report.createdAt)}
                  </p>
                  {report.adminNote && (
                    <p className="mt-2 text-xs text-stone-500">
                      관리자 메모: {report.adminNote}
                    </p>
                  )}
                </div>

                {report.status === "pending" && (
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => void handleDeleteContent(report)}
                      disabled={processingId === report.id}
                      className="bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      게시물 삭제
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDismiss(report.id)}
                      disabled={processingId === report.id}
                      className="border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-60"
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
