"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import BoardCommentThread from "@/components/board/BoardCommentThread";
import EngagementLikeButton from "@/components/engagement/EngagementLikeButton";
import OperatorContentActions from "@/components/admin/OperatorContentActions";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import ReportButton from "@/components/report/ReportButton";
import VideoEditForm from "@/components/videos/VideoEditForm";
import { useContentView } from "@/hooks/useContentView";
import { fetchEngagementAction, fetchEngagementPost } from "@/lib/engagement-client";
import {
  canManageVideo,
  formatVideoDate,
  getYouTubeEmbedUrl,
  type VideoPost,
} from "@/lib/videos";

type VideoDetailViewProps = {
  initialVideo: VideoPost;
};

export default function VideoDetailView({ initialVideo }: VideoDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [video, setVideo] = useState(initialVideo);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [votingComment, setVotingComment] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setVideo(initialVideo);
  }, [initialVideo]);

  useContentView({
    contentId: initialVideo.id,
    storagePrefix: "video-view",
    apiPath: `/api/videos/${initialVideo.id}`,
    onViews: (views) => {
      setVideo((current) =>
        current.id === initialVideo.id ? { ...current, views } : current
      );
    },
    onError: (message) => setError(message),
  });

  useEffect(() => {
    let cancelled = false;

    async function refreshDetail() {
      try {
        const detailRes = await fetch(`/api/videos/${initialVideo.id}`);
        const detailData = await detailRes.json();
        if (!cancelled && detailRes.ok) {
          const fresh = detailData.video as VideoPost;
          setVideo((current) => ({
            ...fresh,
            views: Math.max(current.views ?? 0, fresh.views ?? 0),
          }));
        }
      } catch {
        if (!cancelled) {
          setError("영상 정보를 불러오지 못했습니다.");
        }
      }
    }

    void refreshDetail();

    return () => {
      cancelled = true;
    };
  }, [initialVideo.id]);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/videos/${video.id}`;
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
      const response = await fetchEngagementAction(`/api/videos/${video.id}`, {
        action: "like",
      });
      const data = await response.json();

      if (response.status === 401) return;
      if (!response.ok) {
        throw new Error(data.error ?? "추천 처리에 실패했습니다.");
      }

      setVideo(data.video as VideoPost);
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
      const response = await fetchEngagementPost(`/api/videos/${video.id}`, {
        content: text.trim(),
        ...(parentId ? { parentId } : {}),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "댓글 등록에 실패했습니다.");
      }

      setVideo(data.video as VideoPost);
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
      const response = await fetchEngagementAction(`/api/videos/${video.id}`, {
        action: "comment-vote",
        commentId,
        choice,
      });
      const data = await response.json();

      if (response.status === 401) return null;
      if (!response.ok) {
        throw new Error(data.error ?? "투표 처리에 실패했습니다.");
      }

      setVideo(data.video as VideoPost);
      return (data.myVote ?? null) as "up" | "down" | null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "투표 처리에 실패했습니다.");
      throw err;
    } finally {
      setVotingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`"${video.title}" 영상을 삭제할까요?`)) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "영상 삭제에 실패했습니다.");
      }

      router.push("/videos");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "영상 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const canManage = canManageVideo(user, video);

  return (
    <>
      <article className="portal-panel overflow-hidden">
        <div className="relative aspect-video w-full bg-stone-900">
          <iframe
            src={getYouTubeEmbedUrl(video.youtubeVideoId)}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="portal-badge">{video.category}</span>
              <h1 className="mt-3 text-2xl font-bold text-stone-800">
                {video.title}
              </h1>
              <p className="mt-2 text-sm font-semibold text-signature-dark">
                {video.channelName}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <EngagementLikeButton
                likes={video.likes}
                liking={liking}
                onLike={() => void handleLike()}
                className="portal-btn px-4 py-2 text-sm disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => void handleCopyLink()}
                className="rounded-full border border-signature/30 bg-signature-light px-3 py-1 text-xs font-semibold text-signature-darker hover:bg-signature-muted"
              >
                {copied ? "링크 복사됨" : "공유 링크"}
              </button>
              {canManage && (
                <OperatorContentActions
                  onEdit={() => setShowEdit(true)}
                  onDelete={() => void handleDelete()}
                  deleting={deleting}
                  compact
                />
              )}
              <ReportButton
                targetType="video"
                targetId={video.id}
                targetTitle={video.title}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-stone-500">
            <span>조회 {video.views}</span>
            <span>댓글 {video.comments.length}</span>
            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-signature-dark hover:underline"
            >
              유튜브에서 보기
            </a>
          </div>

          {video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {video.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-signature-light px-2 py-0.5 text-xs text-signature-dark"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {video.description && (
            <p className="whitespace-pre-wrap text-sm leading-7 text-stone-700">
              {video.description}
            </p>
          )}

          <div className="flex items-center justify-between border-t border-signature/10 pt-4 text-sm text-stone-500">
            <span className="inline-flex flex-wrap items-center gap-1">
              <span>등록</span>
              <AuthorWithGrade
                author={video.submitter}
                nicknameClassName="text-sm text-stone-500"
                className="inline-flex max-w-full flex-wrap items-center gap-1"
              />
            </span>
            <span>{formatVideoDate(video.createdAt)}</span>
          </div>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <section className="rounded-3xl border border-signature/20 bg-signature-light/30 p-5">
            <BoardCommentThread
              comments={video.comments}
              user={user}
              loginNextPath={pathname || `/videos/${video.id}`}
              commenting={commenting}
              votingComment={votingComment}
              commentError={commentError}
              voteStoragePrefix="video-comment-vote"
              onSubmitComment={handleCommentSubmit}
              onVote={handleCommentVote}
            />
          </section>
        </div>
      </article>

      {showEdit && (
        <VideoEditForm
          video={video}
          onClose={() => setShowEdit(false)}
          onUpdated={(updated) => {
            setVideo(updated);
            setShowEdit(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

