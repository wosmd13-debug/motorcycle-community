"use client";

import { useState } from "react";
import {
  RiderCafeBasicFields,
  RiderCafeBusinessFields,
  entryToFormValues,
  formValuesToPayload,
  type RiderCafeFormValues,
} from "@/components/cafes/rider-cafe-form-shared";
import type { RiderCafeEntry } from "@/lib/rider-cafe";

type RiderCafeEditFormProps = {
  entry: RiderCafeEntry;
  onClose: () => void;
  onUpdated: (entry: RiderCafeEntry) => void;
};

export default function RiderCafeEditForm({
  entry,
  onClose,
  onUpdated,
}: RiderCafeEditFormProps) {
  const [values, setValues] = useState<RiderCafeFormValues>(
    entryToFormValues(entry)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = <K extends keyof RiderCafeFormValues>(
    key: K,
    value: RiderCafeFormValues[K]
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/rider-cafes/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          ...formValuesToPayload(values),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "정보 수정에 실패했습니다.");
      }

      onUpdated(data.entry as RiderCafeEntry);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "정보 수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">업체 정보 수정</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            닫기
          </button>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          {entry.name} — 전화번호, 영업시간, 오는 길 등을 수정할 수 있습니다.
        </p>

        <div className="mt-6 space-y-4">
          <RiderCafeBasicFields values={values} onChange={handleChange} />
          <RiderCafeBusinessFields values={values} onChange={handleChange} />
        </div>

        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-2xl bg-orange-500 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-60"
        >
          {submitting ? "저장 중..." : "변경사항 저장"}
        </button>
      </form>
    </div>
  );
}
