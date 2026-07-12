"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLoginRedirect } from "@/components/auth/useLoginRedirect";
import VideoCard from "@/components/videos/VideoCard";
import VideoEditForm from "@/components/videos/VideoEditForm";
import VideoUploadForm from "@/components/videos/VideoUploadForm";
import { fetchEngagementAction } from "@/lib/engagement-client";
import {
  filterVideos,
  videoCategories,
  type VideoPost,
} from "@/lib/videos";

export default function VideoExplorer({
  initialVideos,
  initialQuery = "",
}: {
  initialVideos: VideoPost[];
  initialQuery?: string;
}) {
  const { user } = useAuth();
  const ensureLoggedIn = useLoginRedirect();
  const [videos, setVideos] = useState<VideoPost[]>(initialVideos);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] =
    useState<(typeof videoCategories)[number]>("전체");
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const [showUpload, setShowUpload] = useState(false);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [editingVideo, setEditingVideo] = useState<VideoPost | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredVideos = useMemo(
    () => filterVideos({ videos, category, query, sort }),
    [videos, category, query, sort]
  );

  const updateVideo = (updated: VideoPost) => {
    setVideos((current) =>
      current.map((video) => (video.id === updated.id ? updated : video))
    );
  };

  const handleLike = async (id: string) => {
    setLikingId(id);

    try {
      const response = await fetchEngagementAction(`/api/videos/${id}`, {
        action: "like",
      });
      const data = await response.json();

      if (response.status === 401) return;
      if (!response.ok) {
        throw new Error(data.error ?? "추천 처리에 실패했습니다.");
      }

      updateVideo(data.video as VideoPost);
    } catch (err) {
      setError(err instanceof Error ? err.message : "추천 처리에 실패했습니다.");
    } finally {
      setLikingId(null);
    }
  };

  const handleCreated = (video: VideoPost) => {
    setVideos((current) => [video, ...current]);
  };

  const handleDelete = async (video: VideoPost) => {
    if (!window.confirm(`"${video.title}" 영상을 삭제할까요?`)) return;

    setDeletingId(video.id);
    setError(null);

    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "영상 삭제에 실패했습니다.");
      }

      setVideos((current) => current.filter((item) => item.id !== video.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "영상 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="portal-panel overflow-hidden p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-stone-700">영상</p>
            <p className="mt-1 text-xs text-stone-500">
              유튜버·크리에이터 영상 {filteredVideos.length}개
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (ensureLoggedIn()) setShowUpload(true);
            }}
            className="portal-btn px-4 py-2 text-sm"
          >
            + 영상 등록
          </button>
        </div>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="제목, 채널명, 태그 검색..."
          className="mt-4 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {videoCategories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`px-3 py-1.5 text-xs font-semibold transition ${
                category === item
                  ? "bg-signature text-white shadow-sm"
                  : "bg-signature-light/60 text-stone-600 ring-1 ring-signature/20 hover:bg-signature-muted"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <SortButton active={sort === "latest"} onClick={() => setSort("latest")}>
            최신순
          </SortButton>
          <SortButton active={sort === "popular"} onClick={() => setSort("popular")}>
            인기순
          </SortButton>
        </div>
      </div>

      {error && videos.length === 0 ? (
        <div className="portal-panel border-dashed px-6 py-12 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="portal-panel border-dashed px-6 py-16 text-center">
          <p className="font-semibold text-stone-700">조건에 맞는 영상이 없습니다</p>
          <p className="mt-2 text-sm text-stone-500">
            유튜브 채널 영상 URL을 등록해 홍보해 보세요.
          </p>
          <button
            type="button"
            onClick={() => {
              if (ensureLoggedIn()) setShowUpload(true);
            }}
            className="portal-btn mt-4 px-4 py-2 text-sm"
          >
            첫 영상 등록하기
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onLike={handleLike}
              liking={likingId === video.id}
            />
          ))}
        </div>
      )}

      {error && videos.length > 0 && (
        <p className="bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {editingVideo && (
        <VideoEditForm
          video={editingVideo}
          onClose={() => setEditingVideo(null)}
          onUpdated={(video) => {
            updateVideo(video);
            setEditingVideo(null);
          }}
        />
      )}

      {showUpload && (
        <VideoUploadForm
          onClose={() => setShowUpload(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-signature text-white shadow-sm"
          : "bg-white text-stone-600 ring-1 ring-signature/20 hover:bg-signature-light"
      }`}
    >
      {children}
    </button>
  );
}
