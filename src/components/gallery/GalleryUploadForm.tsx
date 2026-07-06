"use client";

import { useState } from "react";
import {
  galleryCategories,
  type GalleryCategory,
  type GalleryPost,
} from "@/lib/gallery";

type GalleryUploadFormProps = {
  onClose: () => void;
  onCreated: (post: GalleryPost) => void;
};

export default function GalleryUploadForm({
  onClose,
  onCreated,
}: GalleryUploadFormProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<GalleryCategory>("라이딩");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (nextFile: File | null) => {
    setFile(nextFile);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("사진을 선택해 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const uploadRes = await fetch("/api/gallery/upload", {
        method: "POST",
        body: uploadData,
      });
      const uploadJson = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadJson.error ?? "이미지 업로드에 실패했습니다.");
      }

      const createRes = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          location,
          category,
          caption,
          imageUrl: uploadJson.imageUrl,
        }),
      });
      const createJson = await createRes.json();

      if (!createRes.ok) {
        throw new Error(createJson.error ?? "게시물 등록에 실패했습니다.");
      }

      onCreated(createJson.post as GalleryPost);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">📸 사진 올리기</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            닫기
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">사진</span>
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
            <div
              className="h-48 rounded-2xl bg-cover bg-center"
              style={{ backgroundImage: `url(${previewUrl})` }}
            />
          )}

          <Input label="제목" value={title} onChange={setTitle} required />
          <Input label="작성자" value={author} onChange={setAuthor} required />
          <Input label="위치" value={location} onChange={setLocation} required />

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">카테고리</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as GalleryCategory)}
              className="mt-2 w-full rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm outline-none focus:border-orange-300"
            >
              {galleryCategories
                .filter((item) => item !== "전체")
                .map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">설명 (선택)</span>
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm outline-none focus:border-orange-300"
              placeholder="라이딩 후기, 코스 정보 등을 적어주세요."
            />
          </label>
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
          {submitting ? "업로드 중..." : "갤러리에 등록"}
        </button>
      </form>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="mt-2 w-full rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm outline-none focus:border-orange-300"
      />
    </label>
  );
}
