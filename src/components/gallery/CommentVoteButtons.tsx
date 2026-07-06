"use client";

import { useEffect, useState } from "react";
import type { CommentVoteChoice } from "@/lib/gallery";

type CommentVoteButtonsProps = {
  commentId: string;
  upvotes: number;
  downvotes: number;
  onVote: (
    commentId: string,
    delta: { up: number; down: number }
  ) => Promise<void>;
  disabled?: boolean;
  storagePrefix?: string;
};

function voteStorageKey(commentId: string, prefix: string) {
  return `${prefix}-${commentId}`;
}

function readVote(commentId: string, prefix: string): CommentVoteChoice | null {
  const value = sessionStorage.getItem(voteStorageKey(commentId, prefix));
  return value === "up" || value === "down" ? value : null;
}

function writeVote(
  commentId: string,
  vote: CommentVoteChoice | null,
  prefix: string
) {
  const key = voteStorageKey(commentId, prefix);
  if (vote) {
    sessionStorage.setItem(key, vote);
  } else {
    sessionStorage.removeItem(key);
  }
}

function getVoteDelta(
  current: CommentVoteChoice | null,
  next: CommentVoteChoice
): { up: number; down: number; nextVote: CommentVoteChoice | null } {
  if (next === "up") {
    if (current === "up") return { up: -1, down: 0, nextVote: null };
    if (current === "down") return { up: 1, down: -1, nextVote: "up" };
    return { up: 1, down: 0, nextVote: "up" };
  }

  if (current === "down") return { up: 0, down: -1, nextVote: null };
  if (current === "up") return { up: -1, down: 1, nextVote: "down" };
  return { up: 0, down: 1, nextVote: "down" };
}

export default function CommentVoteButtons({
  commentId,
  upvotes,
  downvotes,
  onVote,
  disabled = false,
  storagePrefix = "gallery-comment-vote",
}: CommentVoteButtonsProps) {
  const [currentVote, setCurrentVote] = useState<CommentVoteChoice | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    setCurrentVote(readVote(commentId, storagePrefix));
  }, [commentId, storagePrefix]);

  const handleVote = async (choice: CommentVoteChoice) => {
    if (voting || disabled) return;

    const delta = getVoteDelta(currentVote, choice);
    setVoting(true);

    try {
      await onVote(commentId, { up: delta.up, down: delta.down });
      writeVote(commentId, delta.nextVote, storagePrefix);
      setCurrentVote(delta.nextVote);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="mt-3 flex items-center gap-2">
      <button
        type="button"
        onClick={() => handleVote("up")}
        disabled={disabled || voting}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-60 ${
          currentVote === "up"
            ? "bg-orange-500 text-white"
            : "bg-white text-slate-600 ring-1 ring-orange-100 hover:bg-orange-50"
        }`}
      >
        👍 추천 {upvotes}
      </button>
      <button
        type="button"
        onClick={() => handleVote("down")}
        disabled={disabled || voting}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-60 ${
          currentVote === "down"
            ? "bg-slate-700 text-white"
            : "bg-white text-slate-600 ring-1 ring-orange-100 hover:bg-orange-50"
        }`}
      >
        👎 비추천 {downvotes}
      </button>
    </div>
  );
}
