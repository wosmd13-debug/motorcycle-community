"use client";

import { useAuth } from "@/components/auth/AuthProvider";

type OperatorContentActionsProps = {
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
  compact?: boolean;
};

export default function OperatorContentActions({
  onEdit,
  onDelete,
  deleting = false,
  compact = false,
}: OperatorContentActionsProps) {
  const { user } = useAuth();

  const buttonClass = compact
    ? "rounded-full px-3 py-1 text-xs font-semibold"
    : "rounded-full px-3 py-1.5 text-xs font-semibold";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {user?.isOperator && (
        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
          운영자
        </span>
      )}
      <button
        type="button"
        onClick={onEdit}
        className={`${buttonClass} border border-signature/30 bg-white text-signature-dark hover:bg-signature-light`}
      >
        수정
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className={`${buttonClass} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60`}
      >
        {deleting ? "삭제 중..." : "삭제"}
      </button>
    </div>
  );
}
