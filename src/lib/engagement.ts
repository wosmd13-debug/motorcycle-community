import { incrementViews } from "@/lib/engagement-comments";

export type CommentVoteChoice = "up" | "down";

export type LikeTarget = {
  likes: number;
  likedBy?: string[];
};

export type ViewTarget = {
  views: number;
  viewedBy?: string[];
};

export type VotableComment = {
  upvotes: number;
  downvotes: number;
  votesBy?: Record<string, CommentVoteChoice>;
};

/** 로그인 유저 좋아요 토글. 기존 likes 수치(익명 시절 누적)는 보존한 채 ±1 */
export function toggleLikeByUser<T extends LikeTarget>(
  target: T,
  userId: string
): { item: T; liked: boolean } {
  const likedBy = [...(target.likedBy ?? [])];
  const index = likedBy.indexOf(userId);

  if (index >= 0) {
    likedBy.splice(index, 1);
    return {
      item: {
        ...target,
        likedBy,
        likes: Math.max(0, (target.likes ?? 0) - 1),
      },
      liked: false,
    };
  }

  likedBy.push(userId);
  return {
    item: {
      ...target,
      likedBy,
      likes: (target.likes ?? 0) + 1,
    },
    liked: true,
  };
}

export function userHasLiked(
  target: LikeTarget | null | undefined,
  userId: string | null | undefined
): boolean {
  if (!target || !userId) return false;
  return (target.likedBy ?? []).includes(userId);
}

/**
 * 조회자 키당 게시물 1회만 조회수 증가.
 * - 로그인: user id
 * - 비로그인: guest:{ip}
 */
export function recordViewByViewer<T extends ViewTarget>(
  target: T,
  viewerKey: string
): { item: T; recorded: boolean } {
  const key = viewerKey.trim();
  if (!key) return { item: target, recorded: false };

  const viewedBy = target.viewedBy ?? [];
  if (viewedBy.includes(key)) {
    return { item: target, recorded: false };
  }

  return {
    item: {
      ...target,
      viewedBy: [...viewedBy, key],
      views: incrementViews(target.views),
    },
    recorded: true,
  };
}

/** @deprecated Prefer recordViewByViewer */
export function recordViewByUser<T extends ViewTarget>(
  target: T,
  userId: string
): { item: T; recorded: boolean } {
  return recordViewByViewer(target, userId);
}

/** 댓글 추천/비추천 — 서버가 votesBy로 1인 1표 강제 */
export function applyCommentVoteChoice<T extends VotableComment>(
  comment: T,
  userId: string,
  choice: CommentVoteChoice
): { comment: T; myVote: CommentVoteChoice | null } {
  const votesBy = { ...(comment.votesBy ?? {}) };
  const current = votesBy[userId] ?? null;
  let upvotes = comment.upvotes ?? 0;
  let downvotes = comment.downvotes ?? 0;
  let myVote: CommentVoteChoice | null;

  if (choice === "up") {
    if (current === "up") {
      upvotes = Math.max(0, upvotes - 1);
      delete votesBy[userId];
      myVote = null;
    } else if (current === "down") {
      downvotes = Math.max(0, downvotes - 1);
      upvotes += 1;
      votesBy[userId] = "up";
      myVote = "up";
    } else {
      upvotes += 1;
      votesBy[userId] = "up";
      myVote = "up";
    }
  } else if (current === "down") {
    downvotes = Math.max(0, downvotes - 1);
    delete votesBy[userId];
    myVote = null;
  } else if (current === "up") {
    upvotes = Math.max(0, upvotes - 1);
    downvotes += 1;
    votesBy[userId] = "down";
    myVote = "down";
  } else {
    downvotes += 1;
    votesBy[userId] = "down";
    myVote = "down";
  }

  return {
    comment: {
      ...comment,
      upvotes,
      downvotes,
      votesBy,
    },
    myVote,
  };
}

/** 응답에 likedBy / viewedBy / votesBy 가 노출되지 않도록 제거 */
export function toPublicEngagementItem<
  T extends { likedBy?: string[]; viewedBy?: string[]; comments?: unknown },
>(item: T): T {
  const clone = { ...item } as T & {
    likedBy?: string[];
    viewedBy?: string[];
    comments?: Array<Record<string, unknown>>;
  };
  delete clone.likedBy;
  delete clone.viewedBy;

  if (Array.isArray(clone.comments)) {
    clone.comments = clone.comments.map((comment) => {
      if (!comment || typeof comment !== "object") return comment;
      const next = { ...comment };
      delete next.votesBy;
      return next;
    });
  }

  return clone;
}

/** SSR/클라이언트 props용 — 목록 전체를 공개용으로 정제 */
export function toPublicEngagementList<
  T extends { likedBy?: string[]; viewedBy?: string[]; comments?: unknown },
>(items: T[]): T[] {
  return items.map((item) => toPublicEngagementItem(item));
}

