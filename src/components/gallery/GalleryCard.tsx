"use client";

import Image from "next/image";
import {
  formatCommentDate,
  formatGalleryDate,
  type GalleryPost,
} from "@/lib/gallery";

type GalleryCardProps = {
  post: GalleryPost;
  onOpen: (post: GalleryPost) => void;
  onLike: (id: string) => void;
  liking?: boolean;
};

export default function GalleryCard({
  post,
  onOpen,
  onLike,
  liking = false,
}: GalleryCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <button
        type="button"
        onClick={() => onOpen(post)}
        className="block w-full text-left"
      >
        <div className="relative flex h-60 w-full items-center justify-center bg-slate-100 p-3">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      </button>

      <div className="p-5">
        <span className="inline-flex rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
          {post.category}
        </span>
        <h2 className="mt-2 text-lg font-bold text-slate-800">{post.title}</h2>
        <p className="mt-1 text-sm text-slate-500">{post.location}</p>

        <div className="mt-4 flex items-end justify-between gap-3 text-sm">
          <div>
            <p className="text-slate-500">by {post.author}</p>
            <p className="text-xs text-slate-400">{formatGalleryDate(post.createdAt)}</p>
            <div className="mt-2 flex gap-3 text-xs text-slate-400">
              <span>👁 {post.views}</span>
              <span>💬 {post.comments.length}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onLike(post.id)}
            disabled={liking}
            className="rounded-full bg-orange-50 px-3 py-1.5 font-semibold text-orange-600 transition hover:bg-orange-100 disabled:opacity-60"
          >
            ❤️ {post.likes}
          </button>
        </div>
      </div>
    </article>
  );
}
