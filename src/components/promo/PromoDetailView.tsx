"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import EngagementLikeButton from "@/components/engagement/EngagementLikeButton";
import CommentVoteButtons from "@/components/gallery/CommentVoteButtons";
import PromoBusinessInfoPanel from "@/components/promo/PromoBusinessInfoPanel";
import PromoCategoryBadge from "@/components/promo/PromoCategoryBadge";
import PromoEditForm from "@/components/promo/PromoEditForm";
import PromoMedia from "@/components/promo/PromoMedia";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import ReportButton from "@/components/report/ReportButton";
import { fetchEngagementAction } from "@/lib/engagement-client";
import { getSafeHttpUrl } from "@/lib/html-escape";
import {
  canManagePromoPost,
  formatCommentDate,
  formatPromoDate,
  isPromoBanner,
  promoCategoryMeta,
  type PromoPost,
} from "@/lib/promo";
import { getYouTubeEmbedUrl } from "@/lib/videos";

type PromoDetailViewProps = {
  initialPost: PromoPost;
};

export default function PromoDetailView({ initialPost }: PromoDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [post, setPost] = useState(initialPost);
  const [content, setContent] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [votingComment, setVotingComment] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [copied, setCopied] = useState(false);

  const canManage = user ? canManagePromoPost(user, post) : false;
  const meta = promoCategoryMeta[post.category];

  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);

  useEffect(() => {
    const viewKey = `promo-view-${initialPost.id}`;

    async function recordView() {
      try {
        let latest = initialPost;

        if (!sessionStorage.getItem(viewKey)) {
          sessionStorage.setItem(viewKey, "1");
          const viewRes = await fetch(`/api/promo/${initialPost.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "view" }),
          });
          const viewData = await viewRes.json();
          if (viewRes.ok) {
            latest = viewData.post as PromoPost;
          }
        }

        const detailRes = await fetch(`/api/promo/${initialPost.id}`);
        const detailData = await detailRes.json();
        if (detailRes.ok) {
          latest = detailData.post as PromoPost;
        }

        setPost(latest);
      } catch {
        setError("홍보글 정보를 불러오지 못했습니다.");
      }
    }

    void recordView();
  }, [initialPost]);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/promo/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleLike = async () => {
    setLiking(true);
    setError(null);

    try {
      const response = await fetchEngagementAction(`/api/promo/${post.id}`, {
        action: "like",
      });
      const data = await response.json();

      if (response.status === 401) return;
      if (!response.ok) {
        throw new Error(data.error ?? "추천 처리에 실패했습니다.");
      }

      setPost(data.post as PromoPost);
    } catch (err) {
      setError(err instanceof Error ? err.message : "추천 처리에 실패했습니다.");
    } finally {
      setLiking(false);
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
      const response = await fetch(`/api/promo/${post.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "댓글 등록에 실패했습니다.");
      }

      setPost(data.post as PromoPost);
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
      const response = await fetchEngagementAction(`/api/promo/${post.id}`, {
        action: "comment-vote",
        commentId,
        choice,
      });
      const data = await response.json();

      if (response.status === 401) return null;
      if (!response.ok) {
        throw new Error(data.error ?? "투표 처리에 실패했습니다.");
      }

      setPost(data.post as PromoPost);
      return (data.myVote ?? null) as "up" | "down" | null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "투표 처리에 실패했습니다.");
      throw err;
    } finally {
      setVotingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`"${post.title}" 홍보글을 삭제할까요?`)) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/promo/${post.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "홍보글 삭제에 실패했습니다.");
      }

      router.push("/promo");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "홍보글 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const safeLinkUrl = getSafeHttpUrl(post.linkUrl);

  return (
    <>
      <article className="portal-panel overflow-hidden">
        <div className="border-b border-signature/10 bg-white px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <PromoCategoryBadge category={post.category} size="md" />
                {isPromoBanner(post) && (
                  <span className="rounded-full bg-signature px-2.5 py-1 text-[10px] font-bold text-white">
                    배너 홍보
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-stone-500">{meta.summary}</p>
              <h1 className="mt-2 text-2xl font-bold text-stone-800">
                {post.title}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-stone-500">
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
              <button
                type="button"
                onClick={() => void handleCopyLink()}
                className="rounded-full border border-signature/30 bg-signature-light px-3 py-1 text-xs font-semibold text-signature-darker hover:bg-signature-muted"
              >
                {copied ? "링크 복사됨" : "공유 링크"}
              </button>

              {canManage && (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEdit(true)}
                    className="rounded-full border border-signature/30 bg-white px-3 py-1 text-xs font-semibold text-signature-dark hover:bg-signature-light"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    {deleting ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              )}

              <ReportButton
                targetType="promo"
                targetId={post.id}
                targetTitle={post.title}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6 sm:px-8">
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
                    alt=""
                    sizes={
                      isPromoBanner(post)
                        ? "100vw"
                        : "(max-width: 768px) 100vw, 50vw"
                    }
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
              onLike={() => void handleLike()}
              className="portal-btn px-4 py-2 text-sm disabled:opacity-60"
            />
            <span className="text-stone-400">조회 {post.views}</span>
          </div>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <section className="rounded-3xl border border-signature/20 bg-signature-light/30 p-5">
            <h2 className="font-bold text-stone-800">
              댓글 {post.comments.length}
            </h2>

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
                  className="w-full rounded-2xl border border-signature/20 bg-white px-4 py-3 text-sm outline-none focus:border-signature"
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
                  href={`/login?next=${encodeURIComponent(pathname || `/promo/${post.id}`)}`}
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
                        nicknameClassName="text-sm font-semibold text-stone-800"
                        className="inline-flex max-w-full flex-wrap items-center gap-1"
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
                      storagePrefix="promo-comment-vote"
                    />
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </article>

      {showEdit && (
        <PromoEditForm
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

