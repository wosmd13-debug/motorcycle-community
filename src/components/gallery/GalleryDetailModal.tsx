"use client";

import Image from "next/image";
import { useState } from "react";
import CommentVoteButtons from "@/components/gallery/CommentVoteButtons";
import {
  formatCommentDate,
  formatGalleryDate,
  type GalleryPost,
} from "@/lib/gallery";

type GalleryDetailModalProps = {
  post: GalleryPost;
  onClose: () => void;
  onLike: (id: string) => void;
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

export default function GalleryDetailModal({
  post,
  onClose,
  onLike,
  onComment,
  onCommentVote,
  liking = false,
  commenting = false,
  votingComment = false,
}: GalleryDetailModalProps) {
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setCommentError(null);

    if (!author.trim() || !content.trim()) {
      setCommentError("작성자와 댓글 내용을 입력해 주세요.");
      return;
    }

    try {
      await onComment(post.id, author.trim(), content.trim());
      setContent("");
    } catch (err) {
      setCommentError(
        err instanceof Error ? err.message : "댓글 등록에 실패했습니다."
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex min-h-[280px] w-full items-center justify-center bg-slate-100 p-4 sm:min-h-[420px]">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                {post.category}
              </span>
              <h2 className="mt-3 text-2xl font-bold text-slate-800">{post.title}</h2>
              <p className="mt-2 text-sm text-slate-500">{post.location}</p>
            </div>
            <button
              type="button"
              onClick={() => onLike(post.id)}
              disabled={liking}
              className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
            >
              ❤️ {post.likes}
            </button>
          </div>

          <div className="mt-4 flex gap-4 text-sm text-slate-500">
            <span>👁 조회 {post.views}</span>
            <span>💬 댓글 {post.comments.length}</span>
          </div>

          {post.caption && (
            <p className="mt-5 text-sm leading-7 text-slate-600">{post.caption}</p>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-orange-50 pt-4 text-sm text-slate-500">
            <span>by {post.author}</span>
            <span>{formatGalleryDate(post.createdAt)}</span>
          </div>

          <section className="mt-8 border-t border-orange-50 pt-6">
            <h3 className="text-lg font-bold text-slate-800">
              댓글 {post.comments.length}
            </h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <input
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                placeholder="닉네임"
                className="w-full rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm outline-none focus:border-orange-300"
              />
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="댓글을 입력하세요."
                rows={3}
                className="w-full rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm outline-none focus:border-orange-300"
              />
              {commentError && (
                <p className="text-sm text-red-600">{commentError}</p>
              )}
              <button
                type="submit"
                disabled={commenting}
                className="rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
              >
                {commenting ? "등록 중..." : "댓글 등록"}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              {post.comments.length === 0 ? (
                <p className="rounded-2xl bg-orange-50/70 px-4 py-6 text-center text-sm text-slate-500">
                  첫 댓글을 남겨보세요.
                </p>
              ) : (
                post.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-2xl bg-orange-50/70 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">
                        {comment.author}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatCommentDate(comment.createdAt)}
                      </p>
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
                    />
                  </div>
                ))
              )}
            </div>
          </section>

          <button
            type="button"
            onClick={onClose}
            className="mt-8 w-full rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
