const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function write(rel, content) {
  fs.writeFileSync(path.join(root, rel), content, "utf8");
  console.log("wrote", rel);
}

write(
  "src/components/videos/VideoUploadForm.tsx",
  `"use client";

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
    <div className="portal-modal-overlay">
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
    </div>
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
`
);

write(
  "src/components/videos/VideoEditForm.tsx",
  `"use client";

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
      const response = await fetch(\`/api/videos/\${video.id}\`, {
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
    <div className="portal-modal-overlay z-[60]">
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
`
);

write(
  "src/components/gallery/GalleryEditForm.tsx",
  `"use client";

import { useState } from "react";
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

      const response = await fetch(\`/api/gallery/\${post.id}\`, {
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
        throw new Error(data.error ?? "게시물 수정에 실패했습니다.");
      }

      onUpdated(data.post as GalleryPost);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="portal-modal-overlay z-[60]">
      <form
        onSubmit={handleSubmit}
        className="portal-modal-panel max-w-xl overflow-y-auto p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-red-600">갤러리 수정</p>
            <h2 className="mt-1 text-xl font-bold text-stone-800">사진 편집</h2>
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
            className="h-48 rounded-2xl bg-cover bg-center"
            style={{
              backgroundImage: \`url(\${previewUrl ?? imageUrl})\`,
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
                .filter((item) => item !== galleryCategories[0])
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
          {submitting ? "저장 중..." : "변경 저장"}
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
`
);

console.log("done");
