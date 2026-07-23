"use client";

import PortalModal from "@/components/portal/PortalModal";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import OperatorContentActions from "@/components/admin/OperatorContentActions";
import { BoardCategoryBadge } from "@/components/board/BoardCategoryGuide";
import EngagementLikeButton from "@/components/engagement/EngagementLikeButton";
import CommentVoteButtons from "@/components/gallery/CommentVoteButtons";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import ReportButton from "@/components/report/ReportButton";
import { useMemberGradeLookup } from "@/hooks/useMemberGradeLookup";
import { useCosmeticLookup } from "@/hooks/useCosmeticLookup";
import {
  boardCategoryMeta,
  canManageBoardPost,
  formatBoardDate,
  formatCommentDate,
  type BoardPost,
} from "@/lib/board";
import type { CommentVoteChoice } from "@/lib/gallery";
import { collectAuthorGradeSources } from "@/lib/member-grade-display";

type BoardDetailModalProps = {
  post: BoardPost;
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
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
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
  onEdit,
  onDelete,
  deleting = false,
}: BoardDetailModalProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [content, setContent] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);

  const gradeSources = useMemo(
    () => collectAuthorGradeSources([post]),
    [post]
  );
  const gradesByNickname = useMemberGradeLookup(gradeSources);
  const authorNicknames = useMemo(
    () => gradeSources.map((item) => item.author),
    [gradeSources]
  );
  const looksByNickname = useCosmeticLookup(authorNicknames);
  const postHighlight = looksByNickname[post.author]?.postHighlightActive;

  const meta = boardCategoryMeta[post.category];

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
      <div
        className={`portal-modal-panel max-w-3xl shadow-2xl ${
          postHighlight ? "shop-post-highlight" : ""
        }`}
      >
        <div className="portal-modal-header">
          <div className="flex w-full min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <BoardCategoryBadge category={post.category} size="md" />
              <div className="portal-modal-header-actions">
                {onEdit && onDelete && canManageBoardPost(user, post) && (
                  <OperatorContentActions
                    onEdit={onEdit}
                    onDelete={onDelete}
                    deleting={deleting}
                    compact
                  />
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-3 py-1 text-sm text-stone-500 hover:bg-stone-100"
                >
                  닫기
                </button>
                <ReportButton
                  targetType="board"
                  targetId={post.id}
                  targetTitle={post.title}
                />
              </div>
            </div>
            <div className="min-w-0 w-full">
              <p className="text-xs text-stone-500">{meta.summary}</p>
              <h2 className="board-post-title board-post-title-detail mt-2 text-xl font-bold text-stone-800">
                {post.title}
              </h2>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-500">
                <AuthorWithGrade
                  author={post.author}
                  authorGradeId={post.authorGradeId}
                  gradesByNickname={gradesByNickname}
                  looksByNickname={looksByNickname}
                  nicknameClassName="font-medium text-stone-700"
                />
                <span aria-hidden>·</span>
                <span>{formatBoardDate(post.createdAt)}</span>
              </p>
            </div>
          </div>
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

          <p className="whitespace-pre-wrap text-sm leading-7 text-stone-700">
            {post.content}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
            <EngagementLikeButton
              likes={post.likes}
              liking={liking}
              onLike={() => onLike(post.id)}
              label="👍"
              className="gallery-ig-like-btn inline-flex min-h-0 items-center border-0 bg-transparent p-0 text-sm font-medium text-stone-600 shadow-none transition hover:text-signature-dark disabled:opacity-60 touch-manipulation dark:text-stone-300"
            />
            <span>조회 {post.views}</span>
            <span>댓글 {post.comments.length}</span>
          </div>

          <section className="rounded-3xl border border-signature/20 bg-signature-light/30 p-5">
            <h3 className="font-bold text-stone-800">
              댓글 {post.comments.length}
            </h3>

            {user ? (
              <form onSubmit={handleCommentSubmit} className="mt-4 space-y-3">
                <p className="text-xs text-stone-500">
                  {user.nickname}으로 댓글 작성
                </p>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  required
                  rows={3}
                  placeholder="댓글을 입력하세요."
                  className="w-full rounded-2xl border border-signature/20 bg-white px-4 py-3 text-sm outline-none focus:border-signature"
                />
                {commentError && (
                  <p className="text-sm text-red-600">{commentError}</p>
                )}
                <button
                  type="submit"
                  disabled={commenting}
                  className="portal-btn px-4 py-2 text-sm disabled:opacity-60"
                >
                  {commenting ? "등록 중..." : "댓글 등록"}
                </button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-stone-500">
                <Link
                  href={`/login?next=${encodeURIComponent(pathname || "/board")}`}
                  className="font-semibold text-signature-dark hover:underline"
                >
                  로그인
                </Link>
                후 댓글을 작성할 수 있습니다.
              </p>
            )}

            <div className="mt-6 space-y-4">
              {post.comments.length === 0 ? (
                <p className="text-sm text-stone-500">첫 댓글을 남겨보세요.</p>
              ) : (
                post.comments.map((comment) => (
                  <article
                    key={comment.id}
                    className="rounded-2xl border border-signature/20 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <AuthorWithGrade
                        author={comment.author}
                        authorGradeId={comment.authorGradeId}
                        gradesByNickname={gradesByNickname}
                        looksByNickname={looksByNickname}
                      />
                      <span className="text-xs text-stone-400">
                        {formatCommentDate(comment.createdAt)}
                      </span>
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
                      storagePrefix="board-comment-vote"
                    />
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </PortalModal>
  );
}
