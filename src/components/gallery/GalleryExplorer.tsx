"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GalleryCard from "@/components/gallery/GalleryCard";
import GalleryDetailModal from "@/components/gallery/GalleryDetailModal";
import GalleryUploadForm from "@/components/gallery/GalleryUploadForm";
import {
  filterGalleryPosts,
  galleryCategories,
  type GalleryPost,
} from "@/lib/gallery";

export default function GalleryExplorer() {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] =
    useState<(typeof galleryCategories)[number]>("전체");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const [selectedPost, setSelectedPost] = useState<GalleryPost | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [commenting, setCommenting] = useState(false);
  const [votingComment, setVotingComment] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

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
    void loadPosts();
  }, [loadPosts]);

  const filteredPosts = useMemo(
    () => filterGalleryPosts({ posts, category, query, sort }),
    [posts, category, query, sort]
  );

  const updatePost = (updated: GalleryPost) => {
    setPosts((current) =>
      current.map((post) => (post.id === updated.id ? updated : post))
    );
    setSelectedPost((current) =>
      current?.id === updated.id ? updated : current
    );
  };

  const handleOpen = async (post: GalleryPost) => {
    setOpeningId(post.id);
    setSelectedPost(post);

    try {
      const viewKey = `gallery-view-${post.id}`;
      let latest = post;

      if (!sessionStorage.getItem(viewKey)) {
        sessionStorage.setItem(viewKey, "1");
        const viewRes = await fetch(`/api/gallery/${post.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "view" }),
        });
        const viewData = await viewRes.json();
        if (viewRes.ok) {
          latest = viewData.post as GalleryPost;
        }
      }

      const detailRes = await fetch(`/api/gallery/${post.id}`);
      const detailData = await detailRes.json();
      if (detailRes.ok) {
        latest = detailData.post as GalleryPost;
      }

      updatePost(latest);
      setSelectedPost(latest);
    } catch {
      setError("게시물 상세 정보를 불러오지 못했습니다.");
    } finally {
      setOpeningId(null);
    }
  };

  const handleLike = async (id: string) => {
    setLikingId(id);

    try {
      const response = await fetch(`/api/gallery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like" }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "좋아요 처리에 실패했습니다.");
      }

      const updated = data.post as GalleryPost;
      updatePost(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "좋아요 처리에 실패했습니다.");
    } finally {
      setLikingId(null);
    }
  };

  const handleComment = async (id: string, author: string, content: string) => {
    setCommenting(true);

    try {
      const response = await fetch(`/api/gallery/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, content }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "댓글 등록에 실패했습니다.");
      }

      updatePost(data.post as GalleryPost);
    } catch (err) {
      setCommenting(false);
      throw err;
    }

    setCommenting(false);
  };

  const handleCommentVote = async (
    postId: string,
    commentId: string,
    delta: { up: number; down: number }
  ) => {
    setVotingComment(true);

    try {
      const response = await fetch(`/api/gallery/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment-vote",
          commentId,
          up: delta.up,
          down: delta.down,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "투표 처리에 실패했습니다.");
      }

      updatePost(data.post as GalleryPost);
    } finally {
      setVotingComment(false);
    }
  };

  const handleCreated = (post: GalleryPost) => {
    setPosts((current) => [post, ...current]);
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">갤러리 탐색</p>
            <p className="mt-1 text-xs text-slate-500">
              총 {filteredPosts.length}개의 사진
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            + 사진 올리기
          </button>
        </div>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="제목, 작성자, 위치 검색..."
          className="mt-4 w-full rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm outline-none focus:border-orange-300"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {galleryCategories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                category === item
                  ? "bg-orange-500 text-white"
                  : "bg-orange-50 text-slate-600 ring-1 ring-orange-100 hover:bg-orange-100"
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
        <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-orange-100 bg-orange-50 text-sm text-slate-500">
          갤러리 불러오는 중...
        </div>
      ) : error && posts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-orange-200 bg-orange-50/60 px-6 py-12 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-orange-200 bg-orange-50/60 px-6 py-16 text-center">
          <p className="text-4xl">📷</p>
          <p className="mt-4 font-semibold text-slate-700">
            조건에 맞는 사진이 없습니다
          </p>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="mt-4 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
          >
            첫 사진 올리기
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <GalleryCard
              key={post.id}
              post={post}
              onOpen={handleOpen}
              onLike={handleLike}
              liking={likingId === post.id || openingId === post.id}
            />
          ))}
        </div>
      )}

      {error && posts.length > 0 && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {selectedPost && (
        <GalleryDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onLike={handleLike}
          onComment={handleComment}
          onCommentVote={handleCommentVote}
          liking={likingId === selectedPost.id}
          commenting={commenting}
          votingComment={votingComment}
        />
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
          ? "bg-slate-800 text-white"
          : "bg-white text-slate-600 ring-1 ring-orange-100 hover:bg-orange-50"
      }`}
    >
      {children}
    </button>
  );
}
