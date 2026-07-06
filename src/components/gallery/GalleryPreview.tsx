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
    <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800">📸 최근 갤러리</h2>

      <div className="mt-4 space-y-3">
        {posts.length === 0 ? (
          <p className="text-sm text-slate-500">최근 올라온 사진이 없습니다.</p>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              href="/gallery"
              className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-orange-50"
            >
              <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-amber-100">
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div>
                <p className="font-medium text-slate-800">{post.title}</p>
                <p className="text-xs text-slate-500">{post.location}</p>
              </div>
            </Link>
          ))
        )}
      </div>

      <Link
        href="/gallery"
        className="mt-4 inline-block text-sm font-semibold text-orange-500"
      >
        갤러리 더보기 →
      </Link>
    </div>
  );
}
