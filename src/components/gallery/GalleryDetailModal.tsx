"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import EngagementLikeButton from "@/components/engagement/EngagementLikeButton";
import CommentVoteButtons from "@/components/gallery/CommentVoteButtons";
import PortalModal from "@/components/portal/PortalModal";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import { useMemberGradeLookup } from "@/hooks/useMemberGradeLookup";
import { useCosmeticLookup } from "@/hooks/useCosmeticLookup";
import {
  formatCommentDate,
  formatGalleryDate,
  type CommentVoteChoice,
  type GalleryPost,
} from "@/lib/gallery";
import { collectAuthorGradeSources } from "@/lib/member-grade-display";

type GalleryDetailModalProps = {
  post: GalleryPost;
  onClose: () => void;
  onLike: (id: string) => void;
  onComment: (id: string, content: string) => Promise<void>;
  onCommentVote: (
    postId: string,
    commentId: string,
    choice: CommentVoteChoice
  ) => Promise<CommentVoteChoice | null | void>;
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
  const gallerySpotlight = looksByNickname[post.author]?.gallerySpotlightActive;

  const handleSubmit = async (event: React.FormEvent) => {
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
      await onComment(post.id, content.trim());
      setContent("");
    } catch (err) {
      setCommentError(
        err instanceof Error ? err.message : "댓글 등록에 실패했습니다."
      );
    }
  };

  return (
    <PortalModal onClose={onClose}>
      <div className="portal-modal-panel max-w-3xl overflow-y-auto shadow-2xl">
        <div className="portal-modal-header">
          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
              {post.category}
            </span>
            <h2 className="board-post-title board-post-title-detail mt-2 text-xl font-bold text-slate-800 sm:text-2xl">
              {post.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{post.location}</p>
          </div>
          <div className="portal-modal-header-actions">
            <EngagementLikeButton
              likes={post.likes}
              liking={liking}
              onLike={() => onLike(post.id)}
              label="❤️"
              className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-3 py-1 text-sm text-stone-500 hover:bg-stone-100"
            >
              닫기
            </button>
          </div>
        </div>

        <div
          className={`flex min-h-[240px] w-full items-center justify-center bg-slate-100 p-4 sm:min-h-[360px] ${
            gallerySpotlight ? "shop-gallery-spotlight" : ""
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt={post.title}
            className="max-h-[50dvh] w-full object-contain sm:max-h-[420px]"
          />
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex gap-4 text-sm text-slate-500">
            <span>👁 조회 {post.views}</span>
            <span>💬 댓글 {post.comments.length}</span>
          </div>

          {post.caption && (
            <p className="mt-5 text-sm leading-7 text-slate-600">{post.caption}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-orange-50 pt-4 text-sm text-slate-500">
            <div className="flex flex-wrap items-center gap-1">
              <span>by</span>
              <AuthorWithGrade
                author={post.author}
                authorGradeId={post.authorGradeId}
                gradesByNickname={gradesByNickname}
                looksByNickname={looksByNickname}
                nicknameClassName="font-medium text-slate-700"
              />
            </div>
            <span>{formatGalleryDate(post.createdAt)}</span>
          </div>

          <section className="mt-8 border-t border-orange-50 pt-6">
            <h3 className="text-lg font-bold text-slate-800">
              댓글 {post.comments.length}
            </h3>

            {user ? (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <p className="text-xs text-slate-500">
                  {user.nickname}으로 댓글 작성
                </p>
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
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                <Link
                  href={`/login?next=${encodeURIComponent(pathname || "/gallery")}`}
                  className="font-semibold text-orange-600 hover:underline"
                >
                  로그인
                </Link>
                후 댓글을 작성할 수 있습니다.
              </p>
            )}

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
                    <div className="flex flex-wrap items-center gap-2">
                      <AuthorWithGrade
                        author={comment.author}
                        authorGradeId={comment.authorGradeId}
                        gradesByNickname={gradesByNickname}
                        looksByNickname={looksByNickname}
                      />
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
                      onVote={(commentId, choice) =>
                        onCommentVote(post.id, commentId, choice)
                      }
                      disabled={votingComment}
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
