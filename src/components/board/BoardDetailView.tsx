"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import OperatorContentActions from "@/components/admin/OperatorContentActions";
import { BoardCategoryBadge } from "@/components/board/BoardCategoryGuide";
import BoardEditForm from "@/components/board/BoardEditForm";
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
  const postHighlight = looksByNickname[post.author]?.postHighlightActive;

  const meta = boardCategoryMeta[post.category];
  const canManage = canManageBoardPost(user, post);

  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  useEffect(() => {
    const viewKey = `board-view-${initialPost.id}`;
    let cancelled = false;

    async function recordView() {
      if (sessionStorage.getItem(viewKey)) return;

      sessionStorage.setItem(viewKey, "1");

      try {
        const viewRes = await fetch(`/api/board/${initialPost.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "view" }),
        });
        const viewData = await viewRes.json();

        if (cancelled || !viewRes.ok) return;

        const viewed = viewData.post as BoardPost;
        setPost((current) =>
          current.id === viewed.id ? { ...current, views: viewed.views } : current
        );
      } catch {
        if (!cancelled) {
          setError("조회수를 반영하지 못했습니다.");
        }
      }
    }

    void recordView();

    return () => {
      cancelled = true;
    };
  }, [initialPost.id]);

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
      const response = await fetchEngagementPost(`/api/board/${post.id}`, {
        content: content.trim(),
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

          <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500">
            <EngagementLikeButton
              likes={post.likes}
              liking={liking}
              onLike={() => void handleLike()}
              className="portal-btn px-4 py-2 text-sm disabled:opacity-60"
            />
            <span>조회 {post.views}</span>
            <span>댓글 {post.comments.length}</span>
          </div>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <section className="rounded-3xl border border-signature/20 bg-signature-light/30 p-5">
            <h2 className="font-bold text-stone-800">댓글 {post.comments.length}</h2>

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
                        handleCommentVote(commentId, choice)
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
