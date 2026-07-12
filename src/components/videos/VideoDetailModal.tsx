"use client";

import PortalModal from "@/components/portal/PortalModal";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import EngagementLikeButton from "@/components/engagement/EngagementLikeButton";
import CommentVoteButtons from "@/components/gallery/CommentVoteButtons";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import ReportButton from "@/components/report/ReportButton";
import OperatorContentActions from "@/components/admin/OperatorContentActions";
import {
  canManageVideo,
  formatCommentDate,
  formatVideoDate,
  getYouTubeEmbedUrl,
  type VideoPost,
} from "@/lib/videos";
import type { CommentVoteChoice } from "@/lib/gallery";

type VideoDetailModalProps = {
  video: VideoPost;
  onClose: () => void;
  onLike: (id: string) => void;
  onComment: (id: string, author: string, content: string) => Promise<void>;
  onCommentVote: (
    videoId: string,
    commentId: string,
    choice: CommentVoteChoice
  ) => Promise<CommentVoteChoice | null | void>;
  liking?: boolean;
  commenting?: boolean;
  votingComment?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
};

export default function VideoDetailModal({
  video,
  onClose,
  onLike,
  onComment,
  onCommentVote,
  liking = false,
  commenting = false,
  votingComment = false,
  onEdit,
  onDelete,
  deleting = false,
}: VideoDetailModalProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [content, setContent] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setCommentError(null);

    if (!user) {
      setCommentError("로그인 유튜브에서 보기?? 로그인??.");
      return;
    }

    if (!content.trim()) {
      setCommentError("?? 로그인 로그인 로그인.");
      return;
    }

    try {
      await onComment(video.id, user.nickname, content.trim());
      setContent("");
    } catch (err) {
      setCommentError(
        err instanceof Error ? err.message : "?? 로그인 로그인로그인."
      );
    }
  };

  return (
    <PortalModal onClose={onClose}>
      <div
        className="portal-modal-panel max-w-3xl shadow-2xl"
      >
        <div className="relative aspect-video w-full bg-stone-900">
          <iframe
            src={getYouTubeEmbedUrl(video.youtubeVideoId)}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="portal-badge">{video.category}</span>
              <h2 className="mt-3 text-2xl font-bold text-stone-800">{video.title}</h2>
              <p className="mt-2 text-sm font-semibold text-signature-dark">
                {video.channelName}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <EngagementLikeButton
                likes={video.likes}
                liking={liking}
                onLike={() => onLike(video.id)}
                className="portal-btn px-4 py-2 text-sm disabled:opacity-60"
              />
              {onEdit && onDelete && canManageVideo(user, video) && (
                <OperatorContentActions
                  onEdit={onEdit}
                  onDelete={onDelete}
                  deleting={deleting}
                  compact
                />
              )}
              <ReportButton
                targetType="video"
                targetId={video.id}
                targetTitle={video.title}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-stone-500">
            <span>조회 {video.views}</span>
            <span>댓글 {video.comments.length}</span>
            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-signature-dark hover:underline"
            >
              유튜브에서 보기
            </a>
          </div>

          {video.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {video.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-signature-light px-2 py-0.5 text-xs text-signature-dark"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {video.description && (
            <p className="mt-5 text-sm leading-7 text-stone-600">{video.description}</p>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-signature/10 pt-4 text-sm text-stone-500">
            <span className="inline-flex flex-wrap items-center gap-1">
              <span>등록</span>
              <AuthorWithGrade
                author={video.submitter}
                nicknameClassName="text-sm text-stone-500"
                className="inline-flex max-w-full flex-wrap items-center gap-1"
              />
            </span>
            <span>{formatVideoDate(video.createdAt)}</span>
          </div>

          <section className="mt-8 border-t border-signature/10 pt-6">
            <h3 className="text-lg font-bold text-stone-800">
              댓글 {video.comments.length}
            </h3>

            {user ? (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <p className="text-xs text-stone-500">
                  {user.nickname}님으로 작성
                </p>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  required
                  placeholder="댓글을 입력하세요."
                  rows={3}
                  className="w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
                />
                {commentError && (
                  <p className="text-sm text-red-600">{commentError}</p>
                )}
                <button
                  type="submit"
                  disabled={commenting}
                  className="portal-btn px-4 py-2.5 text-sm disabled:opacity-60"
                >
                  {commenting ? "등록 중..." : "댓글 등록"}
                </button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-stone-500">
                <Link
                  href={`/login?next=${encodeURIComponent(pathname || "/videos")}`}
                  className="font-semibold text-signature-dark hover:underline"
                >
                  로그인
                </Link>
                ? 로그인 로그인 ? 로그인?.
              </p>
            )}

            <div className="mt-6 space-y-3">
              {video.comments.length === 0 ? (
                <p className="bg-signature-light/50 px-4 py-6 text-center text-sm text-stone-500">
                  ? 로그인 로그인??.
                </p>
              ) : (
                video.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-signature-light/50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <AuthorWithGrade
                        author={comment.author}
                        nicknameClassName="text-sm font-semibold text-stone-800"
                        className="inline-flex max-w-full flex-wrap items-center gap-1"
                      />
                      <p className="text-xs text-stone-400">
                        {formatCommentDate(comment.createdAt)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">
                      {comment.content}
                    </p>
                    <CommentVoteButtons
                      commentId={comment.id}
                      upvotes={comment.upvotes}
                      downvotes={comment.downvotes}
                      onVote={(commentId, choice) =>
                        onCommentVote(video.id, commentId, choice)
                      }
                      disabled={votingComment}
                      storagePrefix="video-comment-vote"
                    />
                  </div>
                ))
              )}
            </div>
          </section>

          <button
            type="button"
            onClick={onClose}
            className="mt-8 w-full bg-stone-100 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-200"
          >
            닫기
          </button>
        </div>
      </div>
    </PortalModal>
  );
}
