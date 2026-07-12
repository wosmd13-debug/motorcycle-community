"use client";

import PortalModal from "@/components/portal/PortalModal";

import { useState } from "react";
import {
  parseTagsInput,
  parseYouTubeVideoId,
  videoCategories,
  type VideoCategory,
  type VideoPost,
} from "@/lib/videos";

type VideoEditFormProps = {
  video: VideoPost;
  onClose: () => void;
  onUpdated: (video: VideoPost) => void;
};

export default function VideoEditForm({
  video,
  onClose,
  onUpdated,
}: VideoEditFormProps) {
  const [title, setTitle] = useState(video.title);
  const [youtubeUrl, setYoutubeUrl] = useState(video.youtubeUrl);
  const [channelName, setChannelName] = useState(video.channelName);
  const [category, setCategory] = useState<VideoCategory>(video.category);
  const [tagsInput, setTagsInput] = useState(video.tags.join(", "));
  const [description, setDescription] = useState(video.description);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewId = parseYouTubeVideoId(youtubeUrl);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          title,
          youtubeUrl,
          channelName,
          category,
          tags: parseTagsInput(tagsInput),
          description,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "영상 수정에 실패했습니다.");
      }

      onUpdated(data.video as VideoPost);
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
        className="portal-modal-panel max-w-xl overflow-y-auto border border-signature/20 p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-600">영상 수정</p>
            <h2 className="mt-1 text-xl font-bold text-stone-800">영상 편집</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-sm text-stone-500 hover:bg-stone-100"
          >
            닫기
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <Input
            label="유튜브 영상 URL"
            value={youtubeUrl}
            onChange={setYoutubeUrl}
            required
          />
          {previewId ? (
            <p className="text-xs text-green-700">영상 ID 확인됨</p>
          ) : (
            <p className="text-xs text-red-600">올바른 유튜브 URL을 입력해 주세요.</p>
          )}

          <Input label="영상 제목" value={title} onChange={setTitle} required />
          <Input
            label="채널명"
            value={channelName}
            onChange={setChannelName}
            required
          />

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">카테고리</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as VideoCategory)}
              className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
            >
              {videoCategories
                .filter((item) => item !== videoCategories[0])
                .map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
            </select>
          </label>

          <Input
            label="태그 (쉼표 구분)"
            value={tagsInput}
            onChange={setTagsInput}
          />

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">영상 소개</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
            />
          </label>
        </div>

        {error && (
          <p className="mt-4 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !previewId}
          className="portal-btn mt-6 w-full py-3 text-sm disabled:opacity-60"
        >
          {submitting ? "저장 중..." : "변경 저장"}
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
