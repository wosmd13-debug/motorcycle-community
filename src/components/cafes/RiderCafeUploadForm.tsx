"use client";

import PortalModal from "@/components/portal/PortalModal";

import { useState } from "react";
import {
  RiderCafeBasicFields,
  RiderCafeBusinessFields,
  emptyRiderCafeFormValues,
  formValuesToPayload,
  type RiderCafeFormValues,
} from "@/components/cafes/rider-cafe-form-shared";
import type { RiderCafeEntry } from "@/lib/rider-cafe";

type RiderCafeUploadFormProps = {
  onClose: () => void;
  onCreated: (entry: RiderCafeEntry) => void;
};

export default function RiderCafeUploadForm({
  onClose,
  onCreated,
}: RiderCafeUploadFormProps) {
  const [values, setValues] = useState<RiderCafeFormValues>(
    emptyRiderCafeFormValues()
  );
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = <K extends keyof RiderCafeFormValues>(
    key: K,
    value: RiderCafeFormValues[K]
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleFileChange = (nextFile: File | null) => {
    setFile(nextFile);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("카페 사진을 선택해 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const uploadRes = await fetch("/api/rider-cafes/upload", {
        method: "POST",
        body: uploadData,
      });
      const uploadJson = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadJson.error ?? "이미지 업로드에 실패했습니다.");
      }

      const createRes = await fetch("/api/rider-cafes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formValuesToPayload(values),
          imageUrl: uploadJson.imageUrl,
        }),
      });
      const createJson = await createRes.json();

      if (!createRes.ok) {
        throw new Error(createJson.error ?? "카페 등록에 실패했습니다.");
      }

      onCreated(createJson.entry as RiderCafeEntry);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortalModal onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        className="portal-modal-panel max-w-xl overflow-y-auto p-4 shadow-2xl sm:p-8"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">☕ 라이더 카페 등록</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            닫기
          </button>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          카페 기본 정보와 업체 정보(전화번호, 영업시간, 오는 길)를 함께 등록할 수
          있습니다.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">카페 사진</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                handleFileChange(event.target.files?.[0] ?? null)
              }
              className="mt-2 block w-full text-sm text-slate-600"
            />
          </label>

          {previewUrl && (
            <div className="flex h-48 items-center justify-center rounded-2xl bg-slate-100 p-3">
              <img
                src={previewUrl}
                alt="미리보기"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}

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
          className="portal-btn mt-6 w-full py-3 text-sm disabled:opacity-60"
        >
          {submitting ? "등록 중..." : "라이더 카페 등록하기"}
        </button>
      </form>
    </PortalModal>
  );
}
