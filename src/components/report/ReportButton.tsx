"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import PortalModal from "@/components/portal/PortalModal";
import {
  reportReasons,
  type ReportReason,
  type ReportTargetType,
} from "@/lib/reports";

type ReportButtonProps = {
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  className?: string;
};

export default function ReportButton({
  targetType,
  targetId,
  targetTitle,
  className = "",
}: ReportButtonProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>(reportReasons[0]);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          detail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error((data.error as string) ?? "신고 접수에 실패했습니다.");
      }

      setSuccess(true);
      setDetail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "신고 접수에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setSuccess(false);
  };

  if (!user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname || "/")}`}
        className={`text-xs font-medium text-stone-500 hover:text-red-600 ${className}`}
      >
        신고
      </Link>
    );
  }

  if (user.isOperator) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`min-h-[44px] px-2 text-xs font-medium text-stone-500 hover:text-red-600 ${className}`}
      >
        신고
      </button>

      {open && (
        <PortalModal onClose={handleClose} overlayClassName="z-[80]">
          <div className="portal-modal-panel max-w-md p-6 shadow-2xl">
            <div className="portal-modal-header !relative !top-auto border-0 p-0">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-stone-800">콘텐츠 신고</h3>
                <p className="mt-1 line-clamp-2 text-sm text-stone-500">
                  {targetTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="shrink-0 rounded-full px-3 py-2 text-sm text-stone-500 hover:bg-stone-100"
              >
                닫기
              </button>
            </div>

            {success ? (
              <div className="mt-6 space-y-4">
                <p className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  신고가 접수되었습니다. 검토 후 조치하겠습니다.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="portal-btn w-full py-2.5 text-sm"
                >
                  확인
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-stone-700">
                    신고 사유
                  </label>
                  <select
                    value={reason}
                    onChange={(event) =>
                      setReason(event.target.value as ReportReason)
                    }
                    className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-base outline-none focus:border-signature sm:text-sm"
                  >
                    {reportReasons.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-stone-700">
                    상세 내용 (선택)
                  </label>
                  <textarea
                    value={detail}
                    onChange={(event) => setDetail(event.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder="신고 내용을 구체적으로 적어 주세요."
                    className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-base outline-none focus:border-signature sm:text-sm"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="portal-btn flex-1 border border-stone-200 bg-white py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {submitting ? "접수 중..." : "신고하기"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </PortalModal>
      )}
    </>
  );
}
