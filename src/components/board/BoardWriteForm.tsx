"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import PortalModal from "@/components/portal/PortalModal";
import { BoardCategoryGuide } from "@/components/board/BoardCategoryGuide";
import {
  boardCategoryMeta,
  type BoardCategory,
  type BoardPost,
} from "@/lib/board";

type BoardWriteFormProps = {
  onClose: () => void;
  onCreated: (post: BoardPost) => void;
  initialCategory?: BoardCategory;
};

export default function BoardWriteForm({
  onClose,
  onCreated,
  initialCategory = "자유",
}: BoardWriteFormProps) {
  const { user } = useAuth();
  const [category, setCategory] = useState<BoardCategory>(initialCategory);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
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
      const imageUrls: string[] = [];

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

        imageUrls.push(uploadJson.imageUrl as string);
      }

      const createRes = await fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          category,
          imageUrls,
        }),
      });
      const createJson = await createRes.json();

      if (!createRes.ok) {
        throw new Error(createJson.error ?? "게시글 등록에 실패했습니다.");
      }

      onCreated(createJson.post as BoardPost);
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
        className="portal-modal-panel max-w-2xl overflow-y-auto p-4 shadow-2xl sm:p-8"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">✍️ 글쓰기</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            닫기
          </button>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          먼저 카테고리를 선택하세요. 어떤 글을 써야 할지 안내가 표시됩니다.
        </p>

        <div className="mt-5">
          <BoardCategoryGuide
            selected={category}
            onSelect={(value) => {
              if (value !== "전체") setCategory(value);
            }}
            compact
            hideAllOption
          />
        </div>

        <div className="mt-6 space-y-4">
          <Input
            label="제목"
            value={title}
            onChange={setTitle}
            required
            placeholder={meta.titlePlaceholder}
          />
          <p className="text-sm text-slate-500">
            작성자: <strong className="text-slate-800">{user?.nickname}</strong>
          </p>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">내용</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
              rows={6}
              className="mt-2 w-full rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm outline-none focus:border-orange-300"
              placeholder={meta.contentPlaceholder}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              사진 (선택, 최대 5장)
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => handleFilesChange(event.target.files)}
              className="mt-2 block w-full text-sm text-slate-600"
            />
          </label>

          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {previews.map((url) => (
                <div
                  key={url}
                  className="aspect-[4/3] rounded-2xl bg-cover bg-center"
                  style={{ backgroundImage: `url(${url})` }}
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
          className="mt-6 w-full rounded-2xl bg-orange-500 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-60"
        >
          {submitting ? "등록 중..." : `${meta.emoji} ${meta.label} 게시판에 등록`}
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm outline-none focus:border-orange-300"
      />
    </label>
  );
}
