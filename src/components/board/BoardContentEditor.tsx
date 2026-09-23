"use client";

import { useEffect, useRef, useState } from "react";
import { buildTempToken, parseDraftContent } from "@/lib/board-content";

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

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

const IMAGE_CLASS =
  "my-2 block w-full rounded-2xl object-cover ring-1 ring-signature/10";

/** 편집 화면(contentEditable) DOM을, 우리가 쓰는 문자열(줄바꿈 + [[사진:id]] 토큰)로 되돌린다. */
function domToContent(node: Node): string {
  let out = "";

  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent ?? "";
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;

    const el = child as HTMLElement;
    if (el.tagName === "BR") {
      out += "\n";
    } else if (el.tagName === "IMG" && el.dataset.tokenId) {
      out += buildTempToken(el.dataset.tokenId);
    } else if (el.tagName === "DIV" || el.tagName === "P") {
      if (out && !out.endsWith("\n")) out += "\n";
      out += domToContent(el);
      if (!out.endsWith("\n")) out += "\n";
    } else {
      out += domToContent(el);
    }
  });

  return out;
}

/** content 문자열 + attachments로 contentEditable 내부를 안전하게(직접 노드 생성만으로) 그린다. */
function renderIntoDom(
  container: HTMLElement,
  content: string,
  attachments: BoardAttachment[]
) {
  const byId = new Map(attachments.map((item) => [item.id, item.previewUrl]));
  const tokenPattern = /\[\[사진:([a-z0-9]+)\]\]/g;

  container.innerHTML = "";

  const appendText = (text: string) => {
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      if (line) container.appendChild(document.createTextNode(line));
      if (i < lines.length - 1) container.appendChild(document.createElement("br"));
    });
  };

  let lastIndex = 0;
  for (const match of content.matchAll(tokenPattern)) {
    const start = match.index ?? 0;
    appendText(content.slice(lastIndex, start));

    const url = byId.get(match[1]);
    if (url) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "";
      img.setAttribute("contenteditable", "false");
      img.dataset.tokenId = match[1];
      img.className = IMAGE_CLASS;
      container.appendChild(img);
    } else {
      appendText(match[0]);
    }
    lastIndex = start + match[0].length;
  }
  appendText(content.slice(lastIndex));
}

export default function BoardContentEditor({
  content,
  onContentChange,
  attachments,
  onAttachmentsChange,
  placeholder,
  rows = 16,
  remainingSlots,
}: BoardContentEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [dragActive, setDragActive] = useState(false);
  const [isEmpty, setIsEmpty] = useState(content.trim().length === 0);
  const editableRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastRangeRef = useRef<Range | null>(null);
  const dragCounter = useRef(0);
  const mountedContent = useRef(false);

  // 처음 한 번만 문자열 -> DOM으로 그린다. 그 다음부터는 타이핑을 방해하지 않기 위해
  // 이 컴포넌트가 직접 DOM을 바꿀 때(사진 삽입/삭제)만 손댄다.
  useEffect(() => {
    if (mountedContent.current || !editableRef.current) return;
    mountedContent.current = true;
    renderIntoDom(editableRef.current, content, attachments);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 최초 1회만
  }, []);

  const syncContentFromDom = () => {
    if (!editableRef.current) return;
    const next = domToContent(editableRef.current);
    setIsEmpty(next.trim().length === 0);
    onContentChange(next);
  };

  const saveSelectionIfInside = () => {
    const el = editableRef.current;
    if (!el) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (el.contains(range.commonAncestorContainer)) {
      lastRangeRef.current = range.cloneRange();
    }
  };

  useEffect(() => {
    document.addEventListener("selectionchange", saveSelectionIfInside);
    return () => document.removeEventListener("selectionchange", saveSelectionIfInside);
  }, []);

  const insertFiles = (incoming: File[]) => {
    const el = editableRef.current;
    if (!el) return;
    const files = incoming.filter(isImageFile).slice(0, Math.max(0, remainingSlots));
    if (files.length === 0) return;

    el.focus();

    let range = lastRangeRef.current;
    if (!range || !el.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false); // 못 찾으면 맨 끝에 삽입
    }

    const newAttachments: BoardAttachment[] = [];

    files.forEach((file) => {
      const id = randomId();
      const previewUrl = URL.createObjectURL(file);
      const img = document.createElement("img");
      img.src = previewUrl;
      img.alt = "";
      img.setAttribute("contenteditable", "false");
      img.dataset.tokenId = id;
      img.className = IMAGE_CLASS;

      range!.deleteContents();
      range!.insertNode(img);
      range!.setStartAfter(img);
      range!.collapse(true);

      newAttachments.push({ id, file, previewUrl });
    });

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    lastRangeRef.current = range.cloneRange();

    onAttachmentsChange([...attachments, ...newAttachments]);
    syncContentFromDom();
  };

  const handleFileInputChange = (fileList: FileList | null) => {
    if (fileList) insertFiles(Array.from(fileList));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    if (!event.dataTransfer.types.includes("Files")) return;
    dragCounter.current += 1;
    setDragActive(true);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setDragActive(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    dragCounter.current = 0;
    setDragActive(false);
    insertFiles(Array.from(event.dataTransfer.files));
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const imageFiles = Array.from(event.clipboardData?.files ?? []).filter(isImageFile);
    event.preventDefault();

    if (imageFiles.length > 0) {
      insertFiles(imageFiles);
      return;
    }

    // 사진이 아니면 순수 텍스트로만 붙여넣는다 (서식/HTML은 절대 들여오지 않음).
    const text = event.clipboardData?.getData("text/plain") ?? "";
    if (!text) return;
    document.execCommand("insertText", false, text);
    syncContentFromDom();
  };

  const handleRemove = (id: string) => {
    const target = attachments.find((item) => item.id === id);
    if (!target) return;

    const imgNode = editableRef.current?.querySelector(
      `img[data-token-id="${id}"]`
    );
    imgNode?.remove();

    URL.revokeObjectURL(target.previewUrl);
    onAttachmentsChange(attachments.filter((item) => item.id !== id));
    syncContentFromDom();
  };

  const segments = parseDraftContent(content, attachments);
  const panelHeight = `${Math.max(rows, 10) * 1.75}rem`;

  return (
    <div>
      <div className="flex items-center justify-between">
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
        <span className="hidden text-xs text-stone-400 sm:inline">
          사진을 이 안으로 끌어놓거나 붙여넣기(Ctrl+V) 해도 추가돼요
        </span>
      </div>

      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative mt-2"
        hidden={tab !== "write"}
      >
        <div
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncContentFromDom}
          onPaste={handlePaste}
          style={{ minHeight: panelHeight }}
          className="w-full overflow-y-auto whitespace-pre-wrap break-words rounded-2xl border border-signature/20 bg-signature-light/50 px-4 py-3 text-sm leading-7 outline-none focus:border-signature"
        />
        {isEmpty && (
          <p className="pointer-events-none absolute left-4 top-3 text-sm text-stone-400">
            {placeholder}
          </p>
        )}
        {dragActive && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-dashed border-signature bg-signature-light/90">
            <p className="text-sm font-bold text-signature-dark">
              📷 여기에 놓으면 사진이 추가됩니다
            </p>
          </div>
        )}
      </div>

      {tab === "preview" && (
        <div
          style={{ minHeight: panelHeight }}
          className="mt-2 space-y-3 overflow-y-auto rounded-2xl border border-signature/20 bg-white px-4 py-3"
        >
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
          onChange={(event) => handleFileInputChange(event.target.files)}
          className="hidden"
        />
      </div>
      <p className="mt-1 text-xs text-stone-400 sm:hidden">
        사진을 이 안으로 끌어놓거나 붙여넣기 해도 추가돼요
      </p>

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
