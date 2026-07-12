"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GalleryCard from "@/components/gallery/GalleryCard";
import GalleryUploadForm from "@/components/gallery/GalleryUploadForm";
import { useMemberGradeLookup } from "@/hooks/useMemberGradeLookup";
import { useCosmeticLookup } from "@/hooks/useCosmeticLookup";
import { fetchEngagementAction } from "@/lib/engagement-client";
import {
  filterGalleryPosts,
  galleryCategories,
  type GalleryPost,
} from "@/lib/gallery";
import { collectAuthorGradeSources } from "@/lib/member-grade-display";

type GalleryExplorerProps = {
  initialPosts?: GalleryPost[];
  initialQuery?: string;
};

export default function GalleryExplorer({
  initialPosts = [],
  initialQuery = "",
}: GalleryExplorerProps) {
  const [posts, setPosts] = useState<GalleryPost[]>(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] =
    useState<(typeof galleryCategories)[number]>("전체");
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const [showUpload, setShowUpload] = useState(false);
  const [likingId, setLikingId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/gallery");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "갤러리를 불러오지 못했습니다.");
      }

      setPosts(data.posts as GalleryPost[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "갤러리를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialPosts.length > 0) return;
    void loadPosts();
  }, [initialPosts.length, loadPosts]);

  const filteredPosts = useMemo(
    () => filterGalleryPosts({ posts, category, query, sort }),
    [posts, category, query, sort]
  );

  const gradeSources = useMemo(
    () => collectAuthorGradeSources(posts),
    [posts]
  );
  const gradesByNickname = useMemberGradeLookup(gradeSources);
  const authorNicknames = useMemo(
    () => gradeSources.map((item) => item.author),
    [gradeSources]
  );
  const looksByNickname = useCosmeticLookup(authorNicknames);

  const updatePost = (updated: GalleryPost) => {
    setPosts((current) =>
      current.map((post) => (post.id === updated.id ? updated : post))
    );
  };

  const handleLike = async (id: string) => {
    setLikingId(id);

    try {
      const response = await fetchEngagementAction(`/api/gallery/${id}`, {
        action: "like",
      });
      const data = await response.json();

      if (response.status === 401) return;
      if (!response.ok) {
        throw new Error(data.error ?? "좋아요 처리에 실패했습니다.");
      }

      updatePost(data.post as GalleryPost);
    } catch (err) {
      setError(err instanceof Error ? err.message : "좋아요 처리에 실패했습니다.");
    } finally {
      setLikingId(null);
    }
  };

  const handleCreated = (post: GalleryPost) => {
    setPosts((current) => [post, ...current]);
  };

  return (
    <div className="mt-4 space-y-4 sm:mt-8 sm:space-y-6">
      <div className="portal-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-stone-700">갤러리 탐색</p>
            <p className="mt-1 text-xs text-stone-500">
              총 {filteredPosts.length}개의 사진
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="portal-btn px-4 py-2 text-sm"
          >
            + 사진 올리기
          </button>
        </div>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="제목, 작성자, 위치 검색..."
          className="mt-4 w-full rounded-2xl border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {galleryCategories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`portal-filter-chip rounded-full transition ${
                category === item
                  ? "bg-signature text-white"
                  : "bg-signature-light text-stone-600 ring-1 ring-signature/20 hover:bg-signature-muted"
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

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-signature/20 bg-signature-light/40 text-sm text-stone-500">
          갤러리 불러오는 중...
        </div>
      ) : error && posts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-signature/30 bg-signature-light/40 px-6 py-12 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-signature/30 bg-signature-light/40 px-6 py-16 text-center">
          <p className="text-4xl">📷</p>
          <p className="mt-4 font-semibold text-stone-700">
            조건에 맞는 사진이 없습니다
          </p>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="portal-btn mt-4 px-4 py-2 text-sm"
          >
            첫 사진 올리기
          </button>
        </div>
      ) : (
        <div className="gallery-ig-grid grid grid-cols-3 gap-[2px] sm:gap-1 md:grid-cols-3 lg:grid-cols-4">
          {filteredPosts.map((post) => (
            <GalleryCard
              key={post.id}
              post={post}
              onLike={handleLike}
              liking={likingId === post.id}
              gradesByNickname={gradesByNickname}
              looksByNickname={looksByNickname}
            />
          ))}
        </div>
      )}

      {error && posts.length > 0 && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {showUpload && (
        <GalleryUploadForm
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
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-stone-800 text-white"
          : "bg-white text-stone-600 ring-1 ring-signature/20 hover:bg-signature-light"
      }`}
    >
      {children}
    </button>
  );
}
