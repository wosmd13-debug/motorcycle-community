"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { GalleryPost } from "@/lib/gallery";

export default function GalleryPreview() {
  const [posts, setPosts] = useState<GalleryPost[]>([]);

  useEffect(() => {
    fetch("/api/gallery")
      .then(async (response) => {
        if (!response.ok) return [];
        const data = await response.json();
        return (data.posts as GalleryPost[]).slice(0, 2);
      })
      .then(setPosts);
  }, []);

  return (
    <div className="portal-panel p-6">
      <h2 className="text-xl font-bold text-stone-800">📸 최근 갤러리</h2>

      <div className="mt-4 space-y-3">
        {posts.length === 0 ? (
          <p className="text-sm text-stone-500">최근 올라온 사진이 없습니다.</p>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`/gallery/${post.id}`}
              className="flex min-w-0 items-center gap-3 rounded-2xl p-2 transition hover:bg-signature-light"
            >
              <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-signature-light ring-1 ring-signature/20">
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="board-post-title-wrap min-w-0 flex-1">
                <p className="board-post-title board-post-title-clamp font-medium text-stone-800">{post.title}</p>
                <p className="text-xs text-stone-500">{post.location}</p>
              </div>
            </Link>
          ))
        )}
      </div>

      <Link
        href="/gallery"
        className="mt-4 inline-block text-sm font-semibold text-signature-dark hover:text-signature-darker"
      >
        갤러리 더보기 →
      </Link>
    </div>
  );
}
