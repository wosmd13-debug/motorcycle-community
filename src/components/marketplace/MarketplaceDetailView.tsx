"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import EngagementLikeButton from "@/components/engagement/EngagementLikeButton";
import CommentVoteButtons from "@/components/gallery/CommentVoteButtons";
import MarketplaceEditForm from "@/components/marketplace/MarketplaceEditForm";
import MarketplaceSellerPanel from "@/components/marketplace/MarketplaceSellerPanel";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import ReportButton from "@/components/report/ReportButton";
import { fetchEngagementAction } from "@/lib/engagement-client";
import {
  canManageMarketplaceItem,
  formatCommentDate,
  formatMarketplaceDate,
  formatMarketplacePrice,
  marketplaceStatusClass,
  type MarketplaceItem,
  type MarketplaceStatus,
} from "@/lib/marketplace";

type MarketplaceDetailViewProps = {
  initialItem: MarketplaceItem;
};

const statusClass = marketplaceStatusClass;

export default function MarketplaceDetailView({
  initialItem,
}: MarketplaceDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const pathname = usePathname();
  const [item, setItem] = useState(initialItem);
  const [content, setContent] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [votingComment, setVotingComment] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [bumping, setBumping] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canManage = user ? canManageMarketplaceItem(user, item) : false;
  const isOwner = user ? item.sellerId === user.id : false;

  useEffect(() => {
    setItem(initialItem);
  }, [initialItem]);

  useEffect(() => {
    const viewKey = `marketplace-view-${initialItem.id}`;

    async function recordView() {
      try {
        let latest = initialItem;

        if (!sessionStorage.getItem(viewKey)) {
          sessionStorage.setItem(viewKey, "1");
          const viewRes = await fetch(`/api/marketplace/${initialItem.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "view" }),
          });
          const viewData = await viewRes.json();
          if (viewRes.ok) {
            latest = viewData.item as MarketplaceItem;
          }
        }

        const detailRes = await fetch(`/api/marketplace/${initialItem.id}`);
        const detailData = await detailRes.json();
        if (detailRes.ok) {
          latest = detailData.item as MarketplaceItem;
        }

        setItem(latest);
      } catch {
        setError("매물 정보를 불러오지 못했습니다.");
      }
    }

    void recordView();
  }, [initialItem]);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/marketplace/${item.id}`;
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
      const response = await fetchEngagementAction(
        `/api/marketplace/${item.id}`,
        { action: "like" }
      );
      const data = await response.json();

      if (response.status === 401) return;
      if (!response.ok) {
        throw new Error(data.error ?? "관심 등록에 실패했습니다.");
      }

      setItem(data.item as MarketplaceItem);
    } catch (err) {
      setError(err instanceof Error ? err.message : "관심 등록에 실패했습니다.");
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`"${item.title}" 매물을 삭제할까요?`)) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/marketplace/${item.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "매물 삭제에 실패했습니다.");
      }

      router.push("/marketplace");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "매물 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (nextStatus: MarketplaceStatus) => {
    if (item.status === nextStatus) return;

    const message =
      nextStatus === "판매완료"
        ? `"${item.title}" 매물을 판매완료로 표시할까요?`
        : nextStatus === "예약중"
          ? `"${item.title}" 매물을 예약중으로 표시할까요?`
          : `"${item.title}" 매물을 다시 판매중으로 변경할까요?`;

    if (!window.confirm(message)) return;

    setStatusChanging(true);
    setError(null);

    try {
      const response = await fetch(`/api/marketplace/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", status: nextStatus }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "상태 변경에 실패했습니다.");
      }

      setItem(data.item as MarketplaceItem);
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경에 실패했습니다.");
    } finally {
      setStatusChanging(false);
    }
  };

  const handleBump = async () => {
    setBumping(true);
    setError(null);

    try {
      const response = await fetch(`/api/marketplace/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bump" }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "끌어올리기에 실패했습니다.");
      }

      setItem(data.item as MarketplaceItem);
    } catch (err) {
      setError(err instanceof Error ? err.message : "끌어올리기에 실패했습니다.");
    } finally {
      setBumping(false);
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
      const response = await fetch(`/api/marketplace/${item.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "댓글 등록에 실패했습니다.");
      }

      setItem(data.item as MarketplaceItem);
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
      const response = await fetchEngagementAction(
        `/api/marketplace/${item.id}`,
        {
          action: "comment-vote",
          commentId,
          choice,
        }
      );
      const data = await response.json();

      if (response.status === 401) return null;
      if (!response.ok) {
        throw new Error(data.error ?? "투표 처리에 실패했습니다.");
      }

      setItem(data.item as MarketplaceItem);
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-signature-muted px-3 py-1 text-xs font-semibold text-signature-darker">
                  {item.category}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[item.status]}`}
                >
                  {item.status}
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-bold text-stone-800 sm:text-3xl">
                {item.title}
              </h1>
              <p className="mt-2 text-2xl font-bold text-signature-dark">
                {formatMarketplacePrice(item.price)}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-500">
                <AuthorWithGrade
                  author={item.seller}
                  nicknameClassName="text-stone-500"
                  className="inline-flex max-w-full flex-wrap items-center gap-1"
                />
                <span aria-hidden>·</span>
                <span>{formatMarketplaceDate(item.createdAt)}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => void handleCopyLink()}
                className="rounded-full border border-signature/30 bg-signature-light px-3 py-1 text-xs font-semibold text-signature-darker hover:bg-signature-muted"
              >
                {copied ? "링크 복사됨" : "공유 링크"}
              </button>
              <ReportButton
                targetType="marketplace"
                targetId={item.id}
                targetTitle={item.title}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-8">
          {item.imageUrls.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {item.imageUrls.map((url) => (
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

          <dl className="grid gap-3 sm:grid-cols-2">
            <Info label="제품 상태" value={item.condition} />
            <Info label="거래 방식" value={item.delivery} />
            <Info label="지역" value={item.region} />
            <Info label="거래 장소" value={item.location} />
            {item.contactMethod && (
              <Info label="연락 방법" value={item.contactMethod} />
            )}
          </dl>

          <p className="whitespace-pre-wrap text-sm leading-7 text-stone-700">
            {item.description}
          </p>

          {canManage && (
            <MarketplaceSellerPanel
              item={item}
              isOwner={isOwner}
              onStatusChange={(status) => void handleStatusChange(status)}
              onBump={() => void handleBump()}
              onEdit={() => setShowEdit(true)}
              onDelete={() => void handleDelete()}
              statusChanging={statusChanging}
              bumping={bumping}
              deleting={deleting}
            />
          )}

          <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500">
            <EngagementLikeButton
              likes={item.likes}
              liking={liking}
              onLike={() => void handleLike()}
              label="관심"
              className="portal-btn px-4 py-2 text-sm disabled:opacity-60"
            />
            <span>조회 {item.views}</span>
            <span>댓글 {item.comments.length}</span>
          </div>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <section className="rounded-3xl border border-signature/20 bg-signature-light/30 p-5">
            <h2 className="font-bold text-stone-800">거래 관련 댓글</h2>
            <p className="mt-1 text-xs text-stone-500">
              개인 연락처나 계좌번호를 댓글에 남기지 말고, 사이트 내에서 문의해 주세요.
            </p>

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
                  placeholder="구매 문의, 직거래 가능 시간 등을 남겨주세요."
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
                  href={`/login?next=${encodeURIComponent(pathname || "/marketplace")}`}
                  className="font-semibold text-signature-dark hover:underline"
                >
                  로그인
                </Link>
                후 댓글을 작성할 수 있습니다.
              </p>
            )}

            <div className="mt-6 space-y-4">
              {item.comments.length === 0 ? (
                <p className="text-sm text-stone-500">첫 문의를 남겨보세요.</p>
              ) : (
                item.comments.map((comment) => (
                  <article
                    key={comment.id}
                    className="rounded-2xl border border-signature/20 bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
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
                      storagePrefix="marketplace-comment-vote"
                    />
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </article>

      {showEdit && (
        <MarketplaceEditForm
          item={item}
          onClose={() => setShowEdit(false)}
          onUpdated={(updated) => {
            setItem(updated);
            setShowEdit(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-signature-light/70 px-4 py-3">
      <dt className="text-xs font-semibold text-signature-dark">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-stone-800">{value}</dd>
    </div>
  );
}
