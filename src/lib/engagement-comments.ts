import type { MemberGradeId } from "@/lib/ranking";
import type { CommentVoteChoice } from "@/lib/engagement";

export type ThreadComment = {
  id: string;
  author: string;
  authorId?: string;
  authorGradeId?: MemberGradeId;
  content: string;
  parentId?: string;
  upvotes: number;
  downvotes: number;
  votesBy?: Record<string, CommentVoteChoice>;
  createdAt: string;
};

export function normalizeThreadComment<T extends ThreadComment>(comment: T): T {
  return {
    ...comment,
    parentId: comment.parentId?.trim() || undefined,
    upvotes: comment.upvotes ?? 0,
    downvotes: comment.downvotes ?? 0,
  };
}

export function getRootThreadComments<T extends { parentId?: string }>(
  comments: T[]
): T[] {
  return comments.filter((comment) => !comment.parentId);
}

export function getThreadCommentReplies<
  T extends { parentId?: string; createdAt: string },
>(comments: T[], parentId: string): T[] {
  return comments
    .filter((comment) => comment.parentId === parentId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

export function insertThreadComment<T extends ThreadComment>(
  comments: T[],
  comment: T,
  parentId?: string
): T[] | null {
  if (parentId) {
    const parent = comments.find((item) => item.id === parentId);
    if (!parent || parent.parentId) return null;
    return [...comments, comment];
  }

  return [comment, ...comments];
}

export function incrementViews(current: number | undefined): number {
  return (current ?? 0) + 1;
}
