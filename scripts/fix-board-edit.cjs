const fs = require("fs");

const msg = {
  uploadFail: "\uc774\ubbf8\uc9c0 \uc5c5\ub85c\ub4dc\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  updateFail: "\uac8c\uc2dc\uae00 \uc218\uc815\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  genericFail: "\uc218\uc815\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  operator: "\uc6b4\uc601\uc790 \uc218\uc815",
  title: "\uac8c\uc2dc\uae00 \uc218\uc815",
  close: "\ub2eb\uae30",
  all: "\uc804\uccb4",
  subject: "\uc81c\ubaa9",
  body: "\ub0b4\uc6a9",
  remove: "\uc81c\uac70",
  addPhoto: "\uc0ac\uc9c4 \ucd94\uac00",
  saving: "\uc800\uc7a5 \uc911...",
  save: "\uc218\uc815 \uc800\uc7a5",
};

const content = `"use client";

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
          throw new Error(uploadJson.error ?? "${msg.uploadFail}");
        }

        nextImageUrls.push(uploadJson.imageUrl as string);
      }

      const response = await fetch(\`/api/board/\${post.id}\`, {
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
        throw new Error(data.error ?? "${msg.updateFail}");
      }

      onUpdated(data.post as BoardPost);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "${msg.genericFail}");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="portal-modal-overlay z-[60]">
      <form
        onSubmit={handleSubmit}
        className="portal-modal-panel max-w-2xl overflow-y-auto p-4 shadow-2xl sm:p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-600">${msg.operator}</p>
            <h2 className="mt-1 text-xl font-bold text-slate-800">${msg.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            ${msg.close}
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <BoardCategoryGuide
            selected={category}
            onSelect={(value) => {
              if (value !== "${msg.all}") setCategory(value);
            }}
            compact
            hideAllOption
          />

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">${msg.subject}</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              placeholder={meta.titlePlaceholder}
              className="mt-2 w-full rounded-2xl border border-signature/20 bg-signature-light/50 px-4 py-3 text-sm outline-none focus:border-signature"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">${msg.body}</span>
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
                    ${msg.remove}
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">${msg.addPhoto}</span>
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
          {submitting ? "${msg.saving}" : "${msg.save}"}
        </button>
      </form>
    </div>
  );
}
`;

fs.writeFileSync("src/components/board/BoardEditForm.tsx", content, "utf8");
console.log("fixed BoardEditForm");
