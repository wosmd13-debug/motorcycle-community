"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import BoardCommentThread from "@/components/board/BoardCommentThread";
import EngagementLikeButton from "@/components/engagement/EngagementLikeButton";
import PromoBusinessInfoPanel from "@/components/promo/PromoBusinessInfoPanel";
import PromoCategoryBadge from "@/components/promo/PromoCategoryBadge";
import PromoEditForm from "@/components/promo/PromoEditForm";
import PromoMedia from "@/components/promo/PromoMedia";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import ReportButton from "@/components/report/ReportButton";
import { useContentView } from "@/hooks/useContentView";
import { fetchEngagementAction, fetchEngagementPost } from "@/lib/engagement-client";
import { getSafeHttpUrl } from "@/lib/html-escape";
import {
  canManagePromoPost,
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

  useContentView({
    contentId: initialPost.id,
    storagePrefix: "promo-view",
    apiPath: `/api/promo/${initialPost.id}`,
    onViews: (views) => {
      setPost((current) =>
        current.id === initialPost.id ? { ...current, views } : current
      );
    },
    onError: (message) => setError(message),
  });

  useEffect(() => {
    let cancelled = false;

    async function refreshDetail() {
      try {
        const detailRes = await fetch(`/api/promo/${initialPost.id}`);
        const detailData = await detailRes.json();
        if (!cancelled && detailRes.ok) {
          const fresh = detailData.post as PromoPost;
          setPost((current) => ({
            ...fresh,
            views: Math.max(current.views ?? 0, fresh.views ?? 0),
          }));
        }
      } catch {
        if (!cancelled) {
          setError("홍보글 정보를 불러오지 못했습니다.");
        }
      }
    }

    void refreshDetail();

    return () => {
      cancelled = true;
    };
  }, [initialPost.id]);

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
      const response = await fetchEngagementPost(`/api/promo/${post.id}`, {
        content: text.trim(),
        ...(parentId ? { parentId } : {}),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "댓글 등록에 실패했습니다.");
      }

      setPost(data.post as PromoPost);
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
            <BoardCommentThread
              comments={post.comments}
              user={user}
              loginNextPath={pathname || `/promo/${post.id}`}
              commenting={commenting}
              votingComment={votingComment}
              commentError={commentError}
              voteStoragePrefix="promo-comment-vote"
              onSubmitComment={handleCommentSubmit}
              onVote={handleCommentVote}
            />
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

