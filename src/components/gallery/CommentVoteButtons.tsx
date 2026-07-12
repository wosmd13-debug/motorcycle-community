"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLoginRedirect } from "@/components/auth/useLoginRedirect";
import type { CommentVoteChoice } from "@/lib/gallery";

type CommentVoteButtonsProps = {
  commentId: string;
  upvotes: number;
  downvotes: number;
  onVote: (
    commentId: string,
    choice: CommentVoteChoice
  ) => Promise<CommentVoteChoice | null | void>;
  disabled?: boolean;
  storagePrefix?: string;
};

function voteStorageKey(commentId: string, prefix: string) {
  return `${prefix}-${commentId}`;
}

function readVote(commentId: string, prefix: string): CommentVoteChoice | null {
  if (typeof sessionStorage === "undefined") return null;
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

const voteBtnClass = (active: boolean, tone: "up" | "down") =>
  [
    "inline-flex min-h-11 min-w-11 flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-sm touch-manipulation transition disabled:opacity-60 sm:flex-none sm:min-w-[4.5rem]",
    active
      ? tone === "up"
        ? "bg-signature text-white"
        : "bg-stone-700 text-white"
      : "bg-white text-stone-600 ring-1 ring-signature/20 hover:bg-signature-light",
  ].join(" ");

export default function CommentVoteButtons({
  commentId,
  upvotes,
  downvotes,
  onVote,
  disabled = false,
  storagePrefix = "gallery-comment-vote",
}: CommentVoteButtonsProps) {
  const { user } = useAuth();
  const ensureLoggedIn = useLoginRedirect();
  const [currentVote, setCurrentVote] = useState<CommentVoteChoice | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    setCurrentVote(readVote(commentId, storagePrefix));
  }, [commentId, storagePrefix]);

  const handleVote = async (choice: CommentVoteChoice) => {
    if (voting || disabled) return;
    if (!ensureLoggedIn()) return;

    setVoting(true);
    try {
      const myVote = await onVote(commentId, choice);
      if (myVote === undefined) return;
      writeVote(commentId, myVote, storagePrefix);
      setCurrentVote(myVote);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex w-full items-stretch gap-2 sm:w-auto sm:items-center">
        <button
          type="button"
          onClick={() => void handleVote("up")}
          disabled={disabled || voting}
          aria-label={`추천 ${upvotes}`}
          title="추천"
          className={voteBtnClass(currentVote === "up", "up")}
        >
          <span aria-hidden="true">👍</span>
          <span className="tabular-nums text-xs font-semibold">{upvotes}</span>
        </button>
        <button
          type="button"
          onClick={() => void handleVote("down")}
          disabled={disabled || voting}
          aria-label={`비추천 ${downvotes}`}
          title="비추천"
          className={voteBtnClass(currentVote === "down", "down")}
        >
          <span aria-hidden="true">👎</span>
          <span className="tabular-nums text-xs font-semibold">{downvotes}</span>
        </button>
      </div>
      {!user ? (
        <p className="text-[11px] leading-5 text-stone-400">
          투표는{" "}
          <button
            type="button"
            onClick={() => ensureLoggedIn()}
            className="font-semibold text-signature-dark underline-offset-2 hover:underline"
          >
            로그인
          </button>
          후 이용할 수 있습니다.
        </p>
      ) : null}
    </div>
  );
}
