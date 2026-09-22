"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildTempToken,
  insertTokenAtCursor,
  parseDraftContent,
  stripTempToken,
} from "@/lib/board-content";

export type BoardAttachment = {
  id: string;
  file: File;
  previewUrl: string;
};

type BoardContentEditorProps = {
  content: string;
  onContentChange: (value: string) => void;
  attachments: BoardAttachment[];
  onAttachmentsChange: (next: BoardAttachment[]) => void;
  placeholder?: string;
  rows?: number;
  /** 지금 더 추가할 수 있는 사진 수 (다른 곳에 이미 첨부된 사진까지 감안해서 부모가 계산) */
  remainingSlots: number;
};

function randomId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export default function BoardContentEditor({
  content,
  onContentChange,
  attachments,
  onAttachmentsChange,
  placeholder,
  rows = 8,
  remainingSlots,
}: BoardContentEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentsRef = useRef(attachments);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  // 컴포넌트가 사라질 때(글쓰기 취소 등) 미리보기용 blob URL을 정리한다.
  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).slice(0, Math.max(0, remainingSlots));
    if (files.length === 0) return;

    let cursor =
      textareaRef.current?.selectionStart ?? content.length;
    let nextContent = content;
    const nextAttachments = [...attachments];

    for (const file of files) {
      const id = randomId();
      const previewUrl = URL.createObjectURL(file);
      const token = buildTempToken(id);
      const result = insertTokenAtCursor(nextContent, cursor, token);
      nextContent = result.content;
      cursor = result.cursor;
      nextAttachments.push({ id, file, previewUrl });
    }

    onContentChange(nextContent);
    onAttachmentsChange(nextAttachments);

    // 다음 사진도 방금 넣은 자리 바로 뒤에서 이어 넣을 수 있게 커서를 옮겨둔다.
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = (id: string) => {
    const target = attachments.find((item) => item.id === id);
    if (!target) return;

    URL.revokeObjectURL(target.previewUrl);
    onContentChange(stripTempToken(content, buildTempToken(id)));
    onAttachmentsChange(attachments.filter((item) => item.id !== id));
  };

  const segments = parseDraftContent(content, attachments);

  return (
    <div>
      <div className="flex items-center gap-1 text-xs font-semibold text-stone-500">
        <button
          type="button"
          onClick={() => setTab("write")}
          className={`rounded-full px-3 py-1.5 transition ${
            tab === "write" ? "bg-signature-dark text-white" : "hover:bg-signature-light"
          }`}
        >
          작성
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={`rounded-full px-3 py-1.5 transition ${
            tab === "preview" ? "bg-signature-dark text-white" : "hover:bg-signature-light"
          }`}
        >
          미리보기
        </button>
      </div>

      {tab === "write" ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          required
          rows={rows}
          placeholder={placeholder}
          className="mt-2 w-full rounded-2xl border border-signature/20 bg-signature-light/50 px-4 py-3 text-sm outline-none focus:border-signature"
        />
      ) : (
        <div className="mt-2 min-h-[8rem] space-y-3 rounded-2xl border border-signature/20 bg-white px-4 py-3">
          {segments.every((s) => s.type === "text" && !s.value.trim()) ? (
            <p className="text-sm text-stone-400">아직 작성한 내용이 없습니다.</p>
          ) : (
            segments.map((segment, index) =>
              segment.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`prev-img-${index}`}
                  src={segment.previewUrl}
                  alt=""
                  className="w-full rounded-2xl object-cover ring-1 ring-signature/10"
                />
              ) : segment.value ? (
                <p
                  key={`prev-text-${index}`}
                  className="whitespace-pre-wrap text-sm leading-7 text-stone-700"
                >
                  {segment.value}
                </p>
              ) : null
            )
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={remainingSlots <= 0}
          className="rounded-full border border-signature/30 bg-white px-3 py-1.5 text-xs font-semibold text-signature-dark hover:bg-signature-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          📷 사진 추가 (커서 위치에 삽입)
        </button>
        <span className="text-xs text-stone-400">
          {attachments.length}장 첨부됨 · {Math.max(0, remainingSlots)}장 더 가능
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(event) => handleFilesSelected(event.target.files)}
          className="hidden"
        />
      </div>

      {attachments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {attachments.map((item) => (
            <div key={item.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt=""
                className="h-16 w-16 rounded-xl object-cover ring-1 ring-signature/15"
              />
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white"
                aria-label="이 사진 빼기"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
