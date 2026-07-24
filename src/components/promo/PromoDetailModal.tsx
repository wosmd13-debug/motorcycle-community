"use client";

import PortalModal from "@/components/portal/PortalModal";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import EngagementLikeButton from "@/components/engagement/EngagementLikeButton";
import CommentVoteButtons from "@/components/gallery/CommentVoteButtons";
import PromoBusinessInfoPanel from "@/components/promo/PromoBusinessInfoPanel";
import PromoCategoryBadge from "@/components/promo/PromoCategoryBadge";
import PromoMedia from "@/components/promo/PromoMedia";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import ReportButton from "@/components/report/ReportButton";
import { getSafeHttpUrl } from "@/lib/html-escape";
import {
  formatCommentDate,
  formatPromoDate,
  isPromoBanner,
  promoCategoryMeta,
  type PromoPost,
} from "@/lib/promo";
import type { CommentVoteChoice } from "@/lib/gallery";
import { getYouTubeEmbedUrl } from "@/lib/videos";

type PromoDetailModalProps = {
  post: PromoPost;
  onClose: () => void;
  onLike: (id: string) => Promise<void>;
  onComment: (id: string, author: string, content: string) => Promise<void>;
  onCommentVote: (
    postId: string,
    commentId: string,
    choice: CommentVoteChoice
  ) => Promise<CommentVoteChoice | null | void>;
  liking?: boolean;
  commenting?: boolean;
  votingComment?: boolean;
  canManage?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
};

export default function PromoDetailModal({
  post,
  onClose,
  onLike,
  onComment,
  onCommentVote,
  liking = false,
  commenting = false,
  votingComment = false,
  canManage = false,
  onEdit,
  onDelete,
  deleting = false,
}: PromoDetailModalProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [content, setContent] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);

  const meta = promoCategoryMeta[post.category];
  const safeLinkUrl = getSafeHttpUrl(post.linkUrl);

  const handleCommentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setCommentError(null);

    if (!user) {
      setCommentError("댓글을 작성하려면 로그인이 필요합니다.");
      return;
    }

    if (!content.trim()) {
      setCommentError("댓글 내용을 입력해 주세요.");
      return;
    }

    try {
      await onComment(post.id, user.nickname, content.trim());
      setContent("");
    } catch (err) {
      setCommentError(
        err instanceof Error ? err.message : "댓글 등록에 실패했습니다."
      );
    }
  };

  return (
    <PortalModal onClose={onClose}>
      <div className="portal-modal-panel max-w-3xl shadow-2xl">
        <div className="sticky top-0 border-b border-signature/10 bg-white px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <PromoCategoryBadge category={post.category} size="md" />
                {isPromoBanner(post) && (
                  <span className="rounded-full bg-signature px-2.5 py-1 text-[10px] font-bold text-white">
                    배너 홍보
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-stone-500">{meta.summary}</p>
              <h2 className="mt-2 text-xl font-bold text-stone-800">{post.title}</h2>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-500">
                <AuthorWithGrade
                  author={post.author}
                  nicknameClassName="text-stone-500"
                  className="inline-flex max-w-full flex-wrap items-center gap-1"
                />
                <span aria-hidden>·</span>
                <span>{formatPromoDate(post.createdAt)}</span>
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              {canManage && onEdit && onDelete && (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onEdit}
                    className="rounded-full border border-signature/30 bg-white px-3 py-1 text-xs font-semibold text-signature-dark hover:bg-signature-light"
                  >
                    ??
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={deleting}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    {deleting ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full px-3 py-1 text-sm text-stone-500 hover:bg-stone-100"
              >
                닫기
              </button>
              <ReportButton
                targetType="promo"
                targetId={post.id}
                targetTitle={post.title}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          {post.youtubeVideoId && (
            <div className="relative aspect-video w-full overflow-hidden bg-stone-900">
              <iframe
                src={getYouTubeEmbedUrl(post.youtubeVideoId)}
                title={post.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          )}

          {post.imageUrls.length > 0 && (
            <div
              className={
                isPromoBanner(post)
                  ? "overflow-hidden rounded-3xl ring-1 ring-amber-200"
                  : "grid gap-3 sm:grid-cols-2"
              }
            >
              {post.imageUrls.map((url, index) => (
                <div
                  key={url}
                  className={
                    isPromoBanner(post)
                      ? "relative aspect-[21/7] w-full bg-stone-100"
                      : "relative aspect-video bg-stone-100"
                  }
                >
                  <PromoMedia
                    src={url}
                    alt={`${post.title} ??? ${index + 1}`}
                    sizes={isPromoBanner(post) ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
          )}

          <PromoBusinessInfoPanel post={post} />

          <p className="whitespace-pre-wrap text-sm leading-7 text-stone-700">
            {post.content}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            {safeLinkUrl && (
              <a
                href={safeLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-signature-dark hover:underline"
              >
                링크 열기
              </a>
            )}
            {post.youtubeUrl && (
              <a
                href={post.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-signature-dark hover:underline"
              >
                유튜브에서 보기
              </a>
            )}
            <EngagementLikeButton
              likes={post.likes}
              liking={liking}
              onLike={() => onLike(post.id)}
              className="portal-btn px-4 py-2 text-sm disabled:opacity-60"
            />
            <span className="text-stone-400">조회 {post.views}</span>
          </div>

          <section className="border-t border-signature/10 pt-6">
            <h3 className="text-lg font-bold text-stone-800">
              댓글 {post.comments.length}
            </h3>

            {user ? (
              <form onSubmit={handleCommentSubmit} className="mt-4 space-y-3">
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
                  href={`/login?next=${encodeURIComponent(pathname || "/promo")}`}
                  className="font-semibold text-signature-dark hover:underline"
                >
                  로그인
                </Link>
                후 댓글을 작성할 수 있습니다.
              </p>
            )}

            <div className="mt-6 space-y-3">
              {post.comments.length === 0 ? (
                <p className="bg-signature-light/50 px-4 py-6 text-center text-sm text-stone-500">
                  첫 댓글을 남겨보세요.
                </p>
              ) : (
                post.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-signature-light/50 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
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
                        onCommentVote(post.id, commentId, choice)
                      }
                      disabled={votingComment}
                      storagePrefix="promo-comment-vote"
                    />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </PortalModal>
  );
}
