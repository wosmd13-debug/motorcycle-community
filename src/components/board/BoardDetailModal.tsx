"use client";

import { useState } from "react";
import { BoardCategoryBadge } from "@/components/board/BoardCategoryGuide";
import CommentVoteButtons from "@/components/gallery/CommentVoteButtons";
import {
  boardCategoryMeta,
  formatBoardDate,
  formatCommentDate,
  type BoardPost,
} from "@/lib/board";

type BoardDetailModalProps = {
  post: BoardPost;
  onClose: () => void;
  onLike: (id: string) => Promise<void>;
  onComment: (id: string, author: string, content: string) => Promise<void>;
  onCommentVote: (
    postId: string,
    commentId: string,
    delta: { up: number; down: number }
  ) => Promise<void>;
  liking?: boolean;
  commenting?: boolean;
  votingComment?: boolean;
};

export default function BoardDetailModal({
  post,
  onClose,
  onLike,
  onComment,
  onCommentVote,
  liking = false,
  commenting = false,
  votingComment = false,
}: BoardDetailModalProps) {
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);

  const handleCommentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setCommentError(null);

    try {
      await onComment(post.id, author.trim(), content.trim());
      setContent("");
    } catch (err) {
      setCommentError(
        err instanceof Error ? err.message : "댓글 등록에 실패했습니다."
      );
    }
  };

  const meta = boardCategoryMeta[post.category];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-orange-50 bg-white px-6 py-4">
          <div>
            <BoardCategoryBadge category={post.category} size="md" />
            <p className="mt-2 text-xs text-slate-500">{meta.summary}</p>
            <h2 className="mt-2 text-xl font-bold text-slate-800">{post.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {post.author} · {formatBoardDate(post.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            닫기
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          {post.imageUrls.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {post.imageUrls.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="w-full rounded-2xl object-cover"
                />
              ))}
            </div>
          )}

          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {post.content}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <button
              type="button"
              onClick={() => onLike(post.id)}
              disabled={liking}
              className="rounded-full bg-orange-50 px-4 py-2 font-semibold text-orange-600 transition hover:bg-orange-100 disabled:opacity-60"
            >
              ❤️ 좋아요 {post.likes}
            </button>
            <span>👁 조회 {post.views}</span>
            <span>💬 댓글 {post.comments.length}</span>
          </div>

          <section className="rounded-3xl border border-orange-100 bg-orange-50/30 p-5">
            <h3 className="font-bold text-slate-800">
              댓글 {post.comments.length}
            </h3>

            <form onSubmit={handleCommentSubmit} className="mt-4 space-y-3">
              <input
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                required
                placeholder="닉네임"
                className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300"
              />
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                required
                rows={3}
                placeholder="댓글을 입력하세요."
                className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300"
              />
              {commentError && (
                <p className="text-sm text-red-600">{commentError}</p>
              )}
              <button
                type="submit"
                disabled={commenting}
                className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {commenting ? "등록 중..." : "댓글 등록"}
              </button>
            </form>

            <div className="mt-6 space-y-4">
              {post.comments.length === 0 ? (
                <p className="text-sm text-slate-500">첫 댓글을 남겨보세요.</p>
              ) : (
                post.comments.map((comment) => (
                  <article
                    key={comment.id}
                    className="rounded-2xl border border-orange-100 bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm text-slate-800">
                        {comment.author}
                      </strong>
                      <span className="text-xs text-slate-400">
                        {formatCommentDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {comment.content}
                    </p>
                    <CommentVoteButtons
                      commentId={comment.id}
                      upvotes={comment.upvotes}
                      downvotes={comment.downvotes}
                      onVote={(commentId, delta) =>
                        onCommentVote(post.id, commentId, delta)
                      }
                      disabled={votingComment}
                      storagePrefix="board-comment-vote"
                    />
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
