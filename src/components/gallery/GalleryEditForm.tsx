"use client";

import { useState } from "react";
import PortalModal from "@/components/portal/PortalModal";
import {
  galleryCategories,
  type GalleryCategory,
  type GalleryPost,
} from "@/lib/gallery";

type GalleryEditFormProps = {
  post: GalleryPost;
  onClose: () => void;
  onUpdated: (post: GalleryPost) => void;
};

export default function GalleryEditForm({
  post,
  onClose,
  onUpdated,
}: GalleryEditFormProps) {
  const [title, setTitle] = useState(post.title);
  const [location, setLocation] = useState(post.location);
  const [category, setCategory] = useState<GalleryCategory>(post.category);
  const [caption, setCaption] = useState(post.caption ?? "");
  const [imageUrl, setImageUrl] = useState(post.imageUrl);
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
    setSubmitting(true);
    setError(null);

    try {
      let nextImageUrl = imageUrl;

      if (file) {
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

        nextImageUrl = uploadJson.imageUrl as string;
      }

      const response = await fetch(`/api/gallery/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          title,
          location,
          category,
          caption,
          imageUrl: nextImageUrl,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "사진 수정에 실패했습니다.");
      }

      onUpdated(data.post as GalleryPost);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "사진 수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortalModal onClose={onClose} overlayClassName="z-[80]">
      <form
        onSubmit={handleSubmit}
        className="portal-modal-panel max-w-xl overflow-y-auto p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-signature-dark">갤러리 수정</p>
            <h2 className="mt-1 text-xl font-bold text-stone-800">사진 정보 수정</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-stone-500 hover:bg-stone-100"
          >
            닫기
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div
            className="h-48 rounded-2xl bg-cover bg-center ring-1 ring-signature/20"
            style={{
              backgroundImage: `url(${previewUrl ?? imageUrl})`,
            }}
          />

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">사진 변경</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                handleFileChange(event.target.files?.[0] ?? null)
              }
              className="mt-2 block w-full text-sm text-stone-600"
            />
          </label>

          <Input label="제목" value={title} onChange={setTitle} required />
          <Input label="위치" value={location} onChange={setLocation} required />

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">카테고리</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as GalleryCategory)}
              className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
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
            <span className="text-sm font-semibold text-stone-700">설명</span>
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              rows={3}
              className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
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
          className="portal-btn mt-6 w-full py-3 text-sm disabled:opacity-60"
        >
          {submitting ? "저장 중..." : "변경 사항 저장"}
        </button>
      </form>
    </PortalModal>
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
      <span className="text-sm font-semibold text-stone-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
      />
    </label>
  );
}
