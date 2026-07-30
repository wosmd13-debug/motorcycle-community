"use client";


import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import OperatorContentActions from "@/components/admin/OperatorContentActions";
import { BoardCategoryBadge } from "@/components/board/BoardCategoryGuide";
import BoardEditForm from "@/components/board/BoardEditForm";
import BoardCommentThread from "@/components/board/BoardCommentThread";
import EngagementLikeButton from "@/components/engagement/EngagementLikeButton";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import ReportButton from "@/components/report/ReportButton";
import { useMemberGradeLookup } from "@/hooks/useMemberGradeLookup";
import { useCosmeticLookup } from "@/hooks/useCosmeticLookup";
import { useContentView } from "@/hooks/useContentView";
import {
  boardCategoryMeta,
  canManageBoardPost,
  formatBoardDate,
  type BoardPost,
} from "@/lib/board";
import { fetchEngagementAction, fetchEngagementPost } from "@/lib/engagement-client";
import { collectAuthorGradeSources } from "@/lib/member-grade-display";

type BoardDetailViewProps = {
  initialPost: BoardPost;
};

export default function BoardDetailView({ initialPost }: BoardDetailViewProps) {
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
  const postHighlight = looksByNickname[post.author]?.postHighlightActive;

  const meta = boardCategoryMeta[post.category];
  const canManage = canManageBoardPost(user, post);

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
    storagePrefix: user ? `board-view-u-${user.id}` : "board-view-guest",
    apiPath: `/api/board/${initialPost.id}`,
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
      const response = await fetchEngagementAction(`/api/board/${post.id}`, {
        action: "like",
      });
      const data = await response.json();

      if (response.status === 401) return;
      if (!response.ok) {
        throw new Error(data.error ?? "좋아요 처리에 실패했습니다.");
      }

      setPost(data.post as BoardPost);
    } catch (err) {
      setError(err instanceof Error ? err.message : "좋아요 처리에 실패했습니다.");
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`"${post.title}" 게시글을 삭제할까요?`)) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/board/${post.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "게시글 삭제에 실패했습니다.");
      }

      router.push("/board");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시글 삭제에 실패했습니다.");
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
      const response = await fetchEngagementPost(`/api/board/${post.id}`, {
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

      setPost(data.post as BoardPost);
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
      const response = await fetchEngagementAction(`/api/board/${post.id}`, {
        action: "comment-vote",
        commentId,
        choice,
      });
      const data = await response.json();

      if (response.status === 401) return null;
      if (!response.ok) {
        throw new Error(data.error ?? "투표 처리에 실패했습니다.");
      }

      setPost(data.post as BoardPost);
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
      <article
        className={`portal-panel mt-4 overflow-hidden ${
          postHighlight ? "shop-post-highlight" : ""
        }`}
      >
        <div className="border-b border-signature/10 px-5 py-4 sm:px-8 sm:py-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <BoardCategoryBadge category={post.category} size="md" />
              <div className="flex flex-wrap items-center justify-end gap-2">
                {canManage && (
                  <OperatorContentActions
                    onEdit={() => setShowEdit(true)}
                    onDelete={() => void handleDelete()}
                    deleting={deleting}
                    compact
                  />
                )}
                <ReportButton
                  targetType="board"
                  targetId={post.id}
                  targetTitle={post.title}
                />
              </div>
            </div>
            <div className="min-w-0 w-full">
              <p className="text-xs text-stone-500">{meta.summary}</p>
              <h1 className="board-post-title board-post-title-detail mt-2 text-xl font-bold text-stone-800 sm:text-2xl sm:text-3xl">
                {post.title}
              </h1>
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

        <div className="space-y-6 px-5 py-6 sm:px-8">
          {post.imageUrls.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {post.imageUrls.map((url) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="w-full rounded-2xl object-cover ring-1 ring-signature/10"
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
              onLike={() => void handleLike()}
              label="👍"
              className="gallery-ig-like-btn inline-flex min-h-0 items-center border-0 bg-transparent p-0 text-sm font-medium text-stone-600 shadow-none transition hover:text-signature-dark disabled:opacity-60 touch-manipulation dark:text-stone-300"
            />
            <span>조회 {post.views}</span>
            <span>댓글 {post.comments.length}</span>
          </div>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <BoardCommentThread
            comments={post.comments}
            user={user}
            loginNextPath={pathname || "/board"}
            gradesByNickname={gradesByNickname}
            looksByNickname={looksByNickname}
            commenting={commenting}
            votingComment={votingComment}
            commentError={commentError}
            onSubmitComment={handleCommentSubmit}
            onVote={handleCommentVote}
          />
        </div>
      </article>

      {showEdit && (
        <BoardEditForm
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
