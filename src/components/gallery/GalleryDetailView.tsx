"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import EngagementLikeButton from "@/components/engagement/EngagementLikeButton";
import CommentVoteButtons from "@/components/gallery/CommentVoteButtons";
import GalleryEditForm from "@/components/gallery/GalleryEditForm";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import { useMemberGradeLookup } from "@/hooks/useMemberGradeLookup";
import { useCosmeticLookup } from "@/hooks/useCosmeticLookup";
import { fetchEngagementAction } from "@/lib/engagement-client";
import {
  canManageGalleryPost,
  formatCommentDate,
  formatGalleryDate,
  type GalleryPost,
} from "@/lib/gallery";
import { collectAuthorGradeSources } from "@/lib/member-grade-display";

type GalleryDetailViewProps = {
  initialPost: GalleryPost;
};

export default function GalleryDetailView({ initialPost }: GalleryDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const pathname = usePathname();
  const [post, setPost] = useState(initialPost);
  const [content, setContent] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [votingComment, setVotingComment] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const canManage = user ? canManageGalleryPost(user, post) : false;

  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  useEffect(() => {
    const viewKey = `gallery-view-${initialPost.id}`;

    async function recordView() {
      try {
        let latest = initialPost;

        if (!sessionStorage.getItem(viewKey)) {
          sessionStorage.setItem(viewKey, "1");
          const viewRes = await fetch(`/api/gallery/${initialPost.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "view" }),
          });
          const viewData = await viewRes.json();
          if (viewRes.ok) {
            latest = viewData.post as GalleryPost;
          }
        }

        const detailRes = await fetch(`/api/gallery/${initialPost.id}`);
        const detailData = await detailRes.json();
        if (detailRes.ok) {
          latest = detailData.post as GalleryPost;
        }

        setPost(latest);
      } catch {
        setError("게시물 정보를 불러오지 못했습니다.");
      }
    }

    void recordView();
  }, [initialPost]);

  const handleLike = async () => {
    setLiking(true);
    setError(null);

    try {
      const response = await fetchEngagementAction(`/api/gallery/${post.id}`, {
        action: "like",
      });
      const data = await response.json();

      if (response.status === 401) return;
      if (!response.ok) {
        throw new Error(data.error ?? "좋아요 처리에 실패했습니다.");
      }

      setPost(data.post as GalleryPost);
    } catch (err) {
      setError(err instanceof Error ? err.message : "좋아요 처리에 실패했습니다.");
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`"${post.title}" 사진을 삭제할까요?`)) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/gallery/${post.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "게시물 삭제에 실패했습니다.");
      }

      router.push("/gallery");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시물 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

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

    setCommenting(true);

    try {
      const response = await fetch(`/api/gallery/${post.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "댓글 등록에 실패했습니다.");
      }

      setPost(data.post as GalleryPost);
      setContent("");
    } catch (err) {
      setCommentError(
        err instanceof Error ? err.message : "댓글 등록에 실패했습니다."
      );
    } finally {
      setCommenting(false);
    }
  };

  const handleCommentVote = async (
    commentId: string,
    choice: "up" | "down"
  ) => {
    setVotingComment(true);
    setError(null);

    try {
      const response = await fetchEngagementAction(`/api/gallery/${post.id}`, {
        action: "comment-vote",
        commentId,
        choice,
      });
      const data = await response.json();

      if (response.status === 401) return null;
      if (!response.ok) {
        throw new Error(data.error ?? "투표 처리에 실패했습니다.");
      }

      setPost(data.post as GalleryPost);
      return (data.myVote ?? null) as "up" | "down" | null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "투표 처리에 실패했습니다.");
      throw err;
    } finally {
      setVotingComment(false);
    }
  };

  return (
    <>
      <article className="portal-panel mt-4 overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-signature/10 px-5 py-4 sm:px-8 sm:py-5">
          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded-full bg-signature-light px-3 py-1 text-xs font-semibold text-signature-dark">
              {post.category}
            </span>
            <h1 className="board-post-title board-post-title-detail mt-2 text-2xl font-bold text-stone-800 sm:text-3xl">
              {post.title}
            </h1>
            <p className="mt-1 text-sm text-stone-500">{post.location}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {canManage && (
              <div className="flex flex-wrap items-center gap-2">
                {user?.isOperator && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                    운영자
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowEdit(true)}
                  className="rounded-full border border-signature/30 bg-white px-3 py-1.5 text-xs font-semibold text-signature-dark hover:bg-signature-light"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleting}
                  className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                >
                  {deleting ? "삭제 중..." : "삭제"}
                </button>
              </div>
            )}
            <EngagementLikeButton
              likes={post.likes}
              liking={liking}
              onLike={() => void handleLike()}
              label="❤️"
              className="portal-btn px-4 py-2 text-sm disabled:opacity-60"
            />
          </div>
        </div>

        <div
          className={`flex min-h-[280px] w-full items-center justify-center bg-signature-light/30 p-4 sm:min-h-[420px] ${
            gallerySpotlight ? "shop-gallery-spotlight" : ""
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt={post.title}
            className="max-h-[60dvh] w-full object-contain sm:max-h-[520px]"
          />
        </div>

        <div className="p-5 sm:p-8">
          <div className="flex gap-4 text-sm text-stone-500">
            <span>👁 조회 {post.views}</span>
            <span>💬 댓글 {post.comments.length}</span>
          </div>

          {post.caption && (
            <p className="mt-5 text-sm leading-7 text-stone-600">{post.caption}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-signature/10 pt-4 text-sm text-stone-500">
            <div className="flex flex-wrap items-center gap-1">
              <span>by</span>
              <AuthorWithGrade
                author={post.author}
                authorGradeId={post.authorGradeId}
                gradesByNickname={gradesByNickname}
                looksByNickname={looksByNickname}
                nicknameClassName="font-medium text-stone-700"
              />
            </div>
            <span>{formatGalleryDate(post.createdAt)}</span>
          </div>

          {error && (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <section className="mt-8 border-t border-signature/10 pt-6">
            <h2 className="text-lg font-bold text-stone-800">
              댓글 {post.comments.length}
            </h2>

            {user ? (
              <form onSubmit={handleCommentSubmit} className="mt-4 space-y-3">
                <p className="text-xs text-stone-500">
                  {user.nickname}으로 댓글 작성
                </p>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="댓글을 입력하세요."
                  rows={3}
                  className="w-full rounded-2xl border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
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
                  href={`/login?next=${encodeURIComponent(pathname || "/gallery")}`}
                  className="font-semibold text-signature-dark hover:underline"
                >
                  로그인
                </Link>
                후 댓글을 작성할 수 있습니다.
              </p>
            )}

            <div className="mt-6 space-y-3">
              {post.comments.length === 0 ? (
                <p className="rounded-2xl bg-signature-light/50 px-4 py-6 text-center text-sm text-stone-500">
                  첫 댓글을 남겨보세요.
                </p>
              ) : (
                post.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-2xl border border-signature/10 bg-signature-light/40 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <AuthorWithGrade
                        author={comment.author}
                        authorGradeId={comment.authorGradeId}
                        gradesByNickname={gradesByNickname}
                        looksByNickname={looksByNickname}
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
                        handleCommentVote(commentId, choice)
                      }
                      disabled={votingComment}
                    />
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </article>

      {showEdit && (
        <GalleryEditForm
          post={post}
          onClose={() => setShowEdit(false)}
          onUpdated={(updated) => {
            setPost(updated);
            setShowEdit(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
