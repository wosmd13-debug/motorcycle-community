"use client";

import Link from "next/link";
import { useState } from "react";
import CommentVoteButtons from "@/components/gallery/CommentVoteButtons";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import {
  formatCommentDate,
  getBoardCommentReplies,
  getRootBoardComments,
  type BoardComment,
} from "@/lib/board";
import type { MemberGradeId } from "@/lib/ranking";
import type { ShopCosmeticLook } from "@/lib/shop";
import type { PublicUser } from "@/lib/users";

type BoardCommentThreadProps = {
  comments: BoardComment[];
  user: PublicUser | null;
  loginNextPath: string;
  gradesByNickname?: Record<string, MemberGradeId>;
  looksByNickname?: Record<string, ShopCosmeticLook>;
  commenting?: boolean;
  votingComment?: boolean;
  commentError?: string | null;
  heading?: "h2" | "h3";
  onSubmitComment: (content: string, parentId?: string) => Promise<void>;
  onVote: (
    commentId: string,
    choice: "up" | "down"
  ) => Promise<"up" | "down" | null | void>;
};

function CommentItem({
  comment,
  depth,
  gradesByNickname,
  looksByNickname,
  user,
  replyingToId,
  replyContent,
  commenting,
  votingComment,
  onStartReply,
  onCancelReply,
  onReplyContentChange,
  onSubmitReply,
  onVote,
}: {
  comment: BoardComment;
  depth: 0 | 1;
  gradesByNickname?: Record<string, MemberGradeId>;
  looksByNickname?: Record<string, ShopCosmeticLook>;
  user: PublicUser | null;
  replyingToId: string | null;
  replyContent: string;
  commenting?: boolean;
  votingComment?: boolean;
  onStartReply: (commentId: string) => void;
  onCancelReply: () => void;
  onReplyContentChange: (value: string) => void;
  onSubmitReply: (parentId: string) => Promise<void>;
  onVote: (
    commentId: string,
    choice: "up" | "down"
  ) => Promise<"up" | "down" | null | void>;
}) {
  const isReplyFormOpen = replyingToId === comment.id;

  return (
    <article
      className={`rounded-2xl border border-signature/20 bg-white p-4 ${
        depth === 1 ? "ml-2 sm:ml-3" : ""
      }`}
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
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-600">
        {comment.content}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <CommentVoteButtons
          commentId={comment.id}
          upvotes={comment.upvotes}
          downvotes={comment.downvotes}
          onVote={onVote}
          disabled={votingComment}
          storagePrefix="board-comment-vote"
        />
        {user && depth === 0 ? (
          <button
            type="button"
            onClick={() =>
              isReplyFormOpen ? onCancelReply() : onStartReply(comment.id)
            }
            className="min-h-[44px] px-2 text-xs font-semibold text-stone-500 hover:text-signature-dark touch-manipulation"
          >
            {isReplyFormOpen ? "취소" : "답글"}
          </button>
        ) : null}
      </div>

      {isReplyFormOpen && user ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmitReply(comment.id);
          }}
          className="mt-3 space-y-2 border-t border-signature/10 pt-3"
        >
          <p className="text-xs text-stone-500">
            {comment.author}에게 답글
          </p>
          <textarea
            value={replyContent}
            onChange={(event) => onReplyContentChange(event.target.value)}
            required
            rows={2}
            placeholder="답글을 입력하세요."
            className="w-full rounded-2xl border border-signature/20 bg-signature-light/20 px-3 py-2.5 text-sm outline-none focus:border-signature"
          />
          <button
            type="submit"
            disabled={commenting}
            className="portal-btn px-3 py-2 text-xs disabled:opacity-60"
          >
            {commenting ? "등록 중..." : "답글 등록"}
          </button>
        </form>
      ) : null}
    </article>
  );
}

export default function BoardCommentThread({
  comments,
  user,
  loginNextPath,
  gradesByNickname,
  looksByNickname,
  commenting = false,
  votingComment = false,
  commentError = null,
  heading = "h2",
  onSubmitComment,
  onVote,
}: BoardCommentThreadProps) {
  const [rootContent, setRootContent] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const rootComments = getRootBoardComments(comments);
  const HeadingTag = heading;

  const handleRootSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await onSubmitComment(rootContent.trim());
      setRootContent("");
    } catch {
      // 실패 시 입력 내용 유지
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    try {
      await onSubmitComment(replyContent.trim(), parentId);
      setReplyContent("");
      setReplyingToId(null);
    } catch {
      // 실패 시 입력 내용 유지
    }
  };

  return (
    <section className="rounded-3xl border border-signature/20 bg-signature-light/30 p-5">
      <HeadingTag className="font-bold text-stone-800">
        댓글 {comments.length}
      </HeadingTag>

      {user ? (
        <form onSubmit={handleRootSubmit} className="mt-4 space-y-3">
          <p className="text-xs text-stone-500">{user.nickname}으로 댓글 작성</p>
          <textarea
            value={rootContent}
            onChange={(event) => setRootContent(event.target.value)}
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
            href={`/login?next=${encodeURIComponent(loginNextPath)}`}
            className="font-semibold text-signature-dark hover:underline"
          >
            로그인
          </Link>
          후 댓글을 작성할 수 있습니다.
        </p>
      )}

      <div className="mt-6 space-y-4">
        {rootComments.length === 0 ? (
          <p className="text-sm text-stone-500">첫 댓글을 남겨보세요.</p>
        ) : (
          rootComments.map((comment) => {
            const replies = getBoardCommentReplies(comments, comment.id);

            return (
              <div key={comment.id} className="space-y-3">
                <CommentItem
                  comment={comment}
                  depth={0}
                  gradesByNickname={gradesByNickname}
                  looksByNickname={looksByNickname}
                  user={user}
                  replyingToId={replyingToId}
                  replyContent={replyContent}
                  commenting={commenting}
                  votingComment={votingComment}
                  onStartReply={(commentId) => {
                    setReplyingToId(commentId);
                    setReplyContent("");
                  }}
                  onCancelReply={() => {
                    setReplyingToId(null);
                    setReplyContent("");
                  }}
                  onReplyContentChange={setReplyContent}
                  onSubmitReply={handleReplySubmit}
                  onVote={onVote}
                />

                {replies.length > 0 ? (
                  <div className="space-y-3 border-l-2 border-signature/15 pl-2 sm:pl-3">
                    {replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        depth={1}
                        gradesByNickname={gradesByNickname}
                        looksByNickname={looksByNickname}
                        user={user}
                        replyingToId={replyingToId}
                        replyContent={replyContent}
                        commenting={commenting}
                        votingComment={votingComment}
                        onStartReply={() => {}}
                        onCancelReply={() => {}}
                        onReplyContentChange={() => {}}
                        onSubmitReply={async () => {}}
                        onVote={onVote}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
