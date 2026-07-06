"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BoardCategoryBadge,
  BoardCategoryGuide,
} from "@/components/board/BoardCategoryGuide";
import BoardDetailModal from "@/components/board/BoardDetailModal";
import BoardWriteForm from "@/components/board/BoardWriteForm";
import {
  boardCategories,
  filterBoardPosts,
  formatBoardDate,
  type BoardCategory,
  type BoardPost,
} from "@/lib/board";

export default function BoardExplorer() {
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] =
    useState<(typeof boardCategories)[number]>("전체");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const [selectedPost, setSelectedPost] = useState<BoardPost | null>(null);
  const [showWrite, setShowWrite] = useState(false);
  const [writeCategory, setWriteCategory] = useState<BoardCategory>("자유");
  const [likingId, setLikingId] = useState<string | null>(null);
  const [commenting, setCommenting] = useState(false);
  const [votingComment, setVotingComment] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/board");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "게시판을 불러오지 못했습니다.");
      }

      setPosts(data.posts as BoardPost[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "게시판을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const filteredPosts = useMemo(
    () => filterBoardPosts({ posts, category, query, sort }),
    [posts, category, query, sort]
  );

  const updatePost = (updated: BoardPost) => {
    setPosts((current) =>
      current.map((post) => (post.id === updated.id ? updated : post))
    );
    setSelectedPost((current) =>
      current?.id === updated.id ? updated : current
    );
  };

  const handleOpen = async (post: BoardPost) => {
    setOpeningId(post.id);
    setSelectedPost(post);

    try {
      const viewKey = `board-view-${post.id}`;
      let latest = post;

      if (!sessionStorage.getItem(viewKey)) {
        sessionStorage.setItem(viewKey, "1");
        const viewRes = await fetch(`/api/board/${post.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "view" }),
        });
        const viewData = await viewRes.json();
        if (viewRes.ok) {
          latest = viewData.post as BoardPost;
        }
      }

      const detailRes = await fetch(`/api/board/${post.id}`);
      const detailData = await detailRes.json();
      if (detailRes.ok) {
        latest = detailData.post as BoardPost;
      }

      updatePost(latest);
      setSelectedPost(latest);
    } catch {
      setError("게시글 상세 정보를 불러오지 못했습니다.");
    } finally {
      setOpeningId(null);
    }
  };

  const handleLike = async (id: string) => {
    setLikingId(id);

    try {
      const response = await fetch(`/api/board/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like" }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "좋아요 처리에 실패했습니다.");
      }

      updatePost(data.post as BoardPost);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "좋아요 처리에 실패했습니다."
      );
    } finally {
      setLikingId(null);
    }
  };

  const handleComment = async (id: string, author: string, content: string) => {
    setCommenting(true);

    try {
      const response = await fetch(`/api/board/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, content }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "댓글 등록에 실패했습니다.");
      }

      updatePost(data.post as BoardPost);
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
      const response = await fetch(`/api/board/${postId}`, {
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

      updatePost(data.post as BoardPost);
    } finally {
      setVotingComment(false);
    }
  };

  const handleCreated = (post: BoardPost) => {
    setPosts((current) => [post, ...current]);
  };

  const openWriteForm = (prefillCategory?: BoardCategory) => {
    if (prefillCategory) setWriteCategory(prefillCategory);
    else if (category !== "전체") setWriteCategory(category);
    setShowWrite(true);
  };

  return (
    <div className="mt-8 space-y-6">
      <BoardCategoryGuide
        selected={category}
        onSelect={(value) => setCategory(value)}
      />

      <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">글 목록</p>
            <p className="mt-1 text-xs text-slate-500">
              {category === "전체"
                ? `총 ${filteredPosts.length}개의 글`
                : `${category} · ${filteredPosts.length}개`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => openWriteForm()}
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            + 글쓰기
          </button>
        </div>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="제목, 작성자, 내용 검색..."
          className="mt-4 w-full rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm outline-none focus:border-orange-300"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {boardCategories.map((item) => (
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
          <SortButton
            active={sort === "popular"}
            onClick={() => setSort("popular")}
          >
            인기순
          </SortButton>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
        <div className="hidden grid-cols-[90px_1fr_110px_90px_70px_70px_70px] gap-4 border-b border-orange-50 px-6 py-4 text-sm font-semibold text-slate-500 lg:grid">
          <span>분류</span>
          <span>제목</span>
          <span>작성자</span>
          <span>날짜</span>
          <span>조회</span>
          <span>좋아요</span>
          <span>댓글</span>
        </div>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-500">
            게시판 불러오는 중...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-4xl">💬</p>
            <p className="mt-4 font-semibold text-slate-700">
              조건에 맞는 글이 없습니다
            </p>
            <button
              type="button"
              onClick={() => openWriteForm()}
              className="mt-4 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
            >
              첫 글 작성하기
            </button>
          </div>
        ) : (
          <div className="divide-y divide-orange-50">
            {filteredPosts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => handleOpen(post)}
                disabled={openingId === post.id}
                className="grid w-full gap-2 px-4 py-4 text-left transition hover:bg-orange-50/50 disabled:opacity-60 lg:grid-cols-[90px_1fr_110px_90px_70px_70px_70px] lg:items-center lg:gap-4 lg:px-6"
              >
                <span className="lg:flex lg:justify-center">
                  <BoardCategoryBadge category={post.category} />
                </span>
                <span className="font-medium text-slate-800">
                  {post.imageUrls.length > 0 ? "📷 " : ""}
                  {post.title}
                </span>
                <span className="text-sm text-slate-500 lg:text-center">
                  {post.author}
                </span>
                <span className="text-sm text-slate-400 lg:text-center">
                  {formatBoardDate(post.createdAt)}
                </span>
                <span className="text-sm text-slate-400 lg:text-center">
                  {post.views}
                </span>
                <span className="text-sm text-slate-400 lg:text-center">
                  {post.likes}
                </span>
                <span className="text-sm text-slate-400 lg:text-center">
                  {post.comments.length}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {selectedPost && (
        <BoardDetailModal
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

      {showWrite && (
        <BoardWriteForm
          initialCategory={writeCategory}
          onClose={() => setShowWrite(false)}
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
