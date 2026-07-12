"use client";

import Link from "next/link";
import Image from "next/image";
import EngagementLikeButton from "@/components/engagement/EngagementLikeButton";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import {
  formatVideoDate,
  getYouTubeThumbnailUrl,
  type VideoPost,
} from "@/lib/videos";

type VideoCardProps = {
  video: VideoPost;
  onLike: (id: string) => void;
  liking?: boolean;
};

export default function VideoCard({
  video,
  onLike,
  liking = false,
}: VideoCardProps) {
  const thumbnail = getYouTubeThumbnailUrl(video.youtubeVideoId);

  return (
    <article className="portal-panel overflow-hidden transition hover:shadow-md">
      <Link
        href={`/videos/${video.id}`}
        className="group block w-full text-left"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-stone-900">
          <Image
            src={thumbnail}
            alt={video.title}
            fill
            className="object-cover opacity-90 transition group-hover:scale-105 group-hover:opacity-100"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signature/90 text-white shadow-lg">
              ▶
            </span>
          </span>
          <span className="absolute bottom-2 left-2 portal-badge">YouTube</span>
        </div>
      </Link>

      <div className="p-4">
        <span className="inline-flex bg-signature-light px-2 py-0.5 text-xs font-semibold text-signature-dark ring-1 ring-signature/20">
          {video.category}
        </span>
        <h2 className="mt-2 line-clamp-2 text-base font-bold text-stone-800">
          {video.title}
        </h2>
        <p className="mt-1 text-sm font-medium text-signature-dark">
          {video.channelName}
        </p>

        {video.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {video.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="bg-portal-muted px-1.5 py-0.5 text-[10px] text-stone-500"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-end justify-between gap-3 text-sm">
          <div>
            <p className="flex flex-wrap items-center gap-1 text-xs text-stone-500">
              <span>등록</span>
              <AuthorWithGrade
                author={video.submitter}
                nicknameClassName="text-xs text-stone-500"
                className="inline-flex max-w-full flex-wrap items-center gap-1"
              />
            </p>
            <p className="text-xs text-stone-400">{formatVideoDate(video.createdAt)}</p>
            <div className="mt-1 flex gap-3 text-xs text-stone-400">
              <span>조회 {video.views}</span>
              <span>댓글 {video.comments.length}</span>
            </div>
          </div>
          <span
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <EngagementLikeButton
              likes={video.likes}
              liking={liking}
              onLike={() => onLike(video.id)}
              className="bg-signature-light px-3 py-1.5 text-xs font-semibold text-signature-dark ring-1 ring-signature/20 transition hover:bg-signature-muted disabled:opacity-60"
            />
          </span>
        </div>
      </div>
    </article>
  );
}
