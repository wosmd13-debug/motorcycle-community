import Image from "next/image";
import Link from "next/link";
import { readGalleryPosts } from "@/lib/gallery-store";

export default async function HomeFeatured() {
  const posts = (await readGalleryPosts()).slice(0, 4);

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="portal-panel overflow-hidden">
      <div className="portal-panel-head">
        <div className="flex items-center gap-2">
          <h2 className="portal-panel-title">실시간 인기</h2>
          <span className="portal-badge">HOT</span>
        </div>
        <Link href="/gallery" className="portal-panel-more">
          더보기
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-1 bg-signature-muted p-1 sm:grid-cols-4">
        {posts.map((post, index) => (
          <Link
            key={post.id}
            href={`/gallery/${post.id}`}
            className="group relative aspect-[4/3] overflow-hidden bg-stone-900 ring-1 ring-signature/20 transition hover:ring-signature"
          >
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover opacity-90 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
            <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center bg-signature text-[10px] font-bold text-white shadow">
              {index + 1}
            </span>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-8">
              <p className="line-clamp-2 text-xs font-medium leading-5 text-white">
                {post.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
