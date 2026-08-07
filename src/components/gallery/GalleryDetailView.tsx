"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import BoardCommentThread from "@/components/board/BoardCommentThread";
import EngagementLikeButton from "@/components/engagement/EngagementLikeButton";
import GalleryEditForm from "@/components/gallery/GalleryEditForm";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import { useMemberGradeLookup } from "@/hooks/useMemberGradeLookup";
import { useCosmeticLookup } from "@/hooks/useCosmeticLookup";
import { useContentView } from "@/hooks/useContentView";
import { fetchEngagementAction, fetchEngagementPost } from "@/lib/engagement-client";
import {
  canManageGalleryPost,
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
    setPost((current) => {
      if (current.id !== initialPost.id) return initialPost;
      return {
        ...initialPost,
        views: Math.max(current.views ?? 0, initialPost.views ?? 0),
      };
    });
  }, [initialPost]);

  useContentView({
    contentId: initialPost.id,
    storagePrefix: user ? `gallery-view-u-${user.id}` : "gallery-view-guest",
    apiPath: `/api/gallery/${initialPost.id}`,
    onViews: (views) => {
      setPost((current) =>
        current.id === initialPost.id ? { ...current, views } : current
      );
    },
    onError: (message) => setError(message),
  });

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

  const handleCommentSubmit = async (text: string, parentId?: string) => {
    setCommentError(null);

    if (!user) {
      setCommentError("댓글을 작성하려면 로그인이 필요합니다.");
      return;
    }

    if (!text.trim()) {
      setCommentError("댓글 내용을 입력해 주세요.");
      return;
    }

    setCommenting(true);

    try {
      const response = await fetchEngagementPost(`/api/gallery/${post.id}`, {
        content: text.trim(),
        ...(parentId ? { parentId } : {}),
      });
      const data = await response.json();

      if (response.status === 401) {
        setCommentError("로그인이 필요합니다. 다시 로그인해 주세요.");
        return;
      }
      if (!response.ok) {
        throw new Error(data.error ?? "댓글 등록에 실패했습니다.");
      }

      setPost(data.post as GalleryPost);
    } catch (err) {
      setCommentError(
        err instanceof Error ? err.message : "댓글 등록에 실패했습니다."
      );
      throw err;
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
        <div className="border-b border-signature/10 px-5 py-4 sm:px-8 sm:py-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex rounded-full bg-signature-light px-3 py-1 text-xs font-semibold text-signature-dark">
                {post.category}
              </span>
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
              </div>
            </div>
            <div className="min-w-0 w-full">
              <h1 className="board-post-title board-post-title-detail text-2xl font-bold text-stone-800 sm:text-3xl">
                {post.title}
              </h1>
              <p className="mt-1 text-sm text-stone-500">{post.location}</p>
            </div>
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
            <EngagementLikeButton
              likes={post.likes}
              liking={liking}
              onLike={() => void handleLike()}
              label="❤️"
              className="gallery-ig-like-btn inline-flex min-h-0 items-center border-0 bg-transparent p-0 text-sm font-medium text-stone-600 shadow-none transition hover:text-signature-dark disabled:opacity-60 touch-manipulation dark:text-stone-300"
            />
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
            <BoardCommentThread
              comments={post.comments}
              user={user}
              loginNextPath={pathname || "/gallery"}
              gradesByNickname={gradesByNickname}
              looksByNickname={looksByNickname}
              commenting={commenting}
              votingComment={votingComment}
              commentError={commentError}
              voteStoragePrefix="gallery-comment-vote"
              onSubmitComment={handleCommentSubmit}
              onVote={handleCommentVote}
            />
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
