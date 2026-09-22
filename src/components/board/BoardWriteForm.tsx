"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import PortalModal from "@/components/portal/PortalModal";
import { BoardCategoryGuide } from "@/components/board/BoardCategoryGuide";
import BoardContentEditor, {
  type BoardAttachment,
} from "@/components/board/BoardContentEditor";
import {
  boardCategoryMeta,
  type BoardCategory,
  type BoardPost,
} from "@/lib/board";
import { finalizeContentTokens } from "@/lib/board-content";
import { BOARD_MAX_IMAGE_COUNT } from "@/lib/board-upload-limits";
import { BIKE_BRANDS, getBikeBrandById } from "@/lib/home-portal";

type BoardWriteFormProps = {
  onClose: () => void;
  onCreated: (post: BoardPost) => void;
  initialCategory?: BoardCategory;
  initialBikeBrand?: string;
};

export default function BoardWriteForm({
  onClose,
  onCreated,
  initialCategory = "자유",
  initialBikeBrand = "",
}: BoardWriteFormProps) {
  const { user } = useAuth();
  const [category, setCategory] = useState<BoardCategory>(initialCategory);
  const [bikeBrand, setBikeBrand] = useState(initialBikeBrand);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<BoardAttachment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = boardCategoryMeta[category];
  const brandLabel = getBikeBrandById(bikeBrand)?.label;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { content: finalContent, imageUrls } = await finalizeContentTokens(
        content,
        async (id) => {
          const attachment = attachments.find((item) => item.id === id);
          if (!attachment) return null;

          const uploadData = new FormData();
          uploadData.append("file", attachment.file);

          const uploadRes = await fetch("/api/board/upload", {
            method: "POST",
            body: uploadData,
          });
          const uploadJson = await uploadRes.json();

          if (!uploadRes.ok) {
            throw new Error(uploadJson.error ?? "이미지 업로드에 실패했습니다.");
          }

          return uploadJson.imageUrl as string;
        }
      );

      const createRes = await fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: finalContent,
          category,
          imageUrls,
          ...(bikeBrand ? { bikeBrand } : {}),
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

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-700">
            차종(브랜드)
          </span>
          <select
            value={bikeBrand}
            onChange={(event) => setBikeBrand(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm outline-none focus:border-orange-300"
          >
            <option value="">선택 안 함</option>
            {BIKE_BRANDS.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-slate-500">
            차종별 게시판에 올리려면 브랜드를 선택하세요.
          </span>
        </label>

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

          <div>
            <span className="text-sm font-semibold text-slate-700">내용</span>
            <p className="mt-1 text-xs text-slate-500">
              글을 쓰다가 원하는 위치에서 &quot;사진 추가&quot;를 누르면 그 자리에 사진이
              들어갑니다. 미리보기 탭에서 실제 모습을 확인할 수 있어요.
            </p>
            <div className="mt-2">
              <BoardContentEditor
                content={content}
                onContentChange={setContent}
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                placeholder={meta.contentPlaceholder}
                rows={6}
                remainingSlots={BOARD_MAX_IMAGE_COUNT - attachments.length}
              />
            </div>
          </div>
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
          {submitting
            ? "등록 중..."
            : brandLabel
              ? `${meta.emoji} ${brandLabel} · ${meta.label}에 등록`
              : `${meta.emoji} ${meta.label} 게시판에 등록`}
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
