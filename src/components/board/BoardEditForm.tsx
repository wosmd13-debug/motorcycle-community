"use client";

import PortalModal from "@/components/portal/PortalModal";

import { useState } from "react";
import { BoardCategoryGuide } from "@/components/board/BoardCategoryGuide";
import {
  boardCategoryMeta,
  type BoardCategory,
  type BoardPost,
} from "@/lib/board";

type BoardEditFormProps = {
  post: BoardPost;
  onClose: () => void;
  onUpdated: (post: BoardPost) => void;
};

export default function BoardEditForm({
  post,
  onClose,
  onUpdated,
}: BoardEditFormProps) {
  const [category, setCategory] = useState<BoardCategory>(post.category);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [imageUrls, setImageUrls] = useState<string[]>(post.imageUrls);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = boardCategoryMeta[category];

  const handleFilesChange = (nextFiles: FileList | null) => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    const selected = nextFiles ? Array.from(nextFiles).slice(0, 5) : [];
    setFiles(selected);
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const nextImageUrls = [...imageUrls];

      for (const file of files) {
        const uploadData = new FormData();
        uploadData.append("file", file);

        const uploadRes = await fetch("/api/board/upload", {
          method: "POST",
          body: uploadData,
        });
        const uploadJson = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadJson.error ?? "이미지 업로드에 실패했습니다.");
        }

        nextImageUrls.push(uploadJson.imageUrl as string);
      }

      const response = await fetch(`/api/board/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          title,
          content,
          category,
          imageUrls: nextImageUrls.slice(0, 5),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "게시글 수정에 실패했습니다.");
      }

      onUpdated(data.post as BoardPost);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortalModal onClose={onClose} overlayClassName="z-[80]">
      <form
        onSubmit={handleSubmit}
        className="portal-modal-panel max-w-2xl overflow-y-auto p-4 shadow-2xl sm:p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-600">운영자 수정</p>
            <h2 className="mt-1 text-xl font-bold text-slate-800">게시글 수정</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            닫기
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <BoardCategoryGuide
            selected={category}
            onSelect={(value) => {
              if (value !== "전체") setCategory(value);
            }}
            compact
            hideAllOption
          />

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">제목</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              placeholder={meta.titlePlaceholder}
              className="mt-2 w-full rounded-2xl border border-signature/20 bg-signature-light/50 px-4 py-3 text-sm outline-none focus:border-signature"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">내용</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
              rows={8}
              placeholder={meta.contentPlaceholder}
              className="mt-2 w-full rounded-2xl border border-signature/20 bg-signature-light/50 px-4 py-3 text-sm outline-none focus:border-signature"
            />
          </label>

          {imageUrls.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {imageUrls.map((url) => (
                <div key={url} className="relative overflow-hidden rounded-2xl">
                  <img src={url} alt="" className="h-32 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() =>
                      setImageUrls((current) => current.filter((item) => item !== url))
                    }
                    className="absolute right-2 top-2 rounded-full bg-red-600 px-2 py-1 text-[10px] font-bold text-white"
                  >
                    제거
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">사진 추가</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => handleFilesChange(event.target.files)}
              className="mt-2 block w-full text-sm text-slate-600"
            />
          </label>

          {previews.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {previews.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="h-32 w-full rounded-2xl object-cover"
                />
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-2xl bg-signature-dark py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {submitting ? "저장 중..." : "수정 저장"}
        </button>
      </form>
    </PortalModal>
  );
}
