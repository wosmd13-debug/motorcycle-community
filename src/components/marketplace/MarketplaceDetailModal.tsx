"use client";

import PortalModal from "@/components/portal/PortalModal";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import EngagementLikeButton from "@/components/engagement/EngagementLikeButton";
import CommentVoteButtons from "@/components/gallery/CommentVoteButtons";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import ReportButton from "@/components/report/ReportButton";
import {
  canManageMarketplaceItem,
  formatCommentDate,
  formatMarketplaceDate,
  formatMarketplacePrice,
  marketplaceStatusClass,
  type MarketplaceItem,
  type MarketplaceStatus,
} from "@/lib/marketplace";
import type { CommentVoteChoice } from "@/lib/gallery";
import MarketplaceSellerPanel from "@/components/marketplace/MarketplaceSellerPanel";

type MarketplaceDetailModalProps = {
  item: MarketplaceItem;
  onClose: () => void;
  onLike: (id: string) => void;
  onComment: (id: string, author: string, content: string) => Promise<void>;
  onCommentVote: (
    itemId: string,
    commentId: string,
    choice: CommentVoteChoice
  ) => Promise<CommentVoteChoice | null | void>;
  liking?: boolean;
  commenting?: boolean;
  votingComment?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: MarketplaceStatus) => void;
  onBump?: () => void;
  deleting?: boolean;
  statusChanging?: boolean;
  bumping?: boolean;
};

const statusClass = marketplaceStatusClass;

export default function MarketplaceDetailModal({
  item,
  onClose,
  onLike,
  onComment,
  onCommentVote,
  liking = false,
  commenting = false,
  votingComment = false,
  onEdit,
  onDelete,
  onStatusChange,
  onBump,
  deleting = false,
  statusChanging = false,
  bumping = false,
}: MarketplaceDetailModalProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [content, setContent] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canManage = canManageMarketplaceItem(user, item);
  const isOwner = Boolean(user && item.sellerId === user.id);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/marketplace?id=${item.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleCommentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setCommentError(null);

    if (!user) {
      setCommentError("댓글을 작성하려면 로그인이 필요합니다.");
      return;
    }

    try {
      await onComment(item.id, user.nickname, content.trim());
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
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-signature/15 bg-white px-6 py-4">
          <div>
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
            <h2 className="mt-3 text-2xl font-bold text-stone-800">{item.title}</h2>
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
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-3 py-1 text-sm text-stone-500 hover:bg-stone-100"
            >
              닫기
            </button>
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

        <div className="space-y-6 px-6 py-6">
          {item.imageUrls.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {item.imageUrls.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="w-full rounded-2xl object-cover"
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

          {canManage && onEdit && onDelete && onStatusChange && onBump && (
            <MarketplaceSellerPanel
              item={item}
              isOwner={isOwner}
              onStatusChange={onStatusChange}
              onBump={onBump}
              onEdit={onEdit}
              onDelete={onDelete}
              statusChanging={statusChanging}
              bumping={bumping}
              deleting={deleting}
            />
          )}

          <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500">
            <EngagementLikeButton
              likes={item.likes}
              liking={liking}
              onLike={() => onLike(item.id)}
              label="관심"
              className="rounded-full bg-signature-light px-4 py-2 font-semibold text-signature-dark transition hover:bg-signature-muted disabled:opacity-60"
            />
            <span>조회 {item.views}</span>
            <span>댓글 {item.comments.length}</span>
          </div>

          <section className="rounded-3xl border border-signature/20 bg-signature-light/30 p-5">
            <h3 className="font-bold text-stone-800">거래 관련 댓글</h3>
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
                  className="rounded-full bg-signature-dark px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
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
                        onCommentVote(item.id, commentId, choice)
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
      </div>
    </PortalModal>
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
