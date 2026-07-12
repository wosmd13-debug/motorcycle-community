"use client";

import PortalModal from "@/components/portal/PortalModal";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  parseTagsInput,
  parseYouTubeVideoId,
  videoCategories,
  type VideoCategory,
  type VideoPost,
} from "@/lib/videos";

type VideoUploadFormProps = {
  onClose: () => void;
  onCreated: (video: VideoPost) => void;
};

export default function VideoUploadForm({
  onClose,
  onCreated,
}: VideoUploadFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [channelName, setChannelName] = useState("");
  const [category, setCategory] = useState<VideoCategory>(videoCategories[1]);
  const [tagsInput, setTagsInput] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewId = parseYouTubeVideoId(youtubeUrl);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        throw new Error(data.error ?? "영상 등록에 실패했습니다.");
      }

      onCreated(data.video as VideoPost);
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
        className="portal-modal-panel max-w-xl overflow-y-auto border border-signature/20 p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-800">영상 등록</h2>
            <p className="mt-1 text-xs text-stone-500">
              유튜브 영상 URL을 입력해 공유하세요.
            </p>
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
            placeholder="https://www.youtube.com/watch?v=..."
          />
          {previewId && (
            <p className="text-xs text-green-700">
              영상 ID 확인됨 · 등록 가능합니다
            </p>
          )}
          {youtubeUrl && !previewId && (
            <p className="text-xs text-red-600">
              올바른 유튜브 URL을 입력해 주세요.
            </p>
          )}

          <Input label="영상 제목" value={title} onChange={setTitle} required />
          <Input
            label="채널명"
            value={channelName}
            onChange={setChannelName}
            required
            placeholder="유튜브 채널 이름"
          />
          <p className="text-sm text-stone-500">
            등록자: <strong>{user?.nickname}</strong>
          </p>

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
            label="태그 (쉼표 구분, 선택)"
            value={tagsInput}
            onChange={setTagsInput}
            placeholder="투어, 정비, 강원"
          />

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">영상 소개</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
              placeholder="영상 내용, 촬영 지역, 추천 포인트 등을 적어주세요."
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
          {submitting ? "등록 중..." : "영상 등록"}
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
      <span className="text-sm font-semibold text-stone-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
      />
    </label>
  );
}
