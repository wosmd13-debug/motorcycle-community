import Link from "next/link";
import { formatBoardDate } from "@/lib/board";
import { readBoardPosts } from "@/lib/board-store";
import { readGalleryPosts } from "@/lib/gallery-store";
import { buildHomeFeedItems, type HomeFeedItem } from "@/lib/home-feed";

function FeedCard({ item }: { item: HomeFeedItem }) {
  const fallbackIcon = item.source === "gallery" ? "📷" : "📝";

  return (
    <Link href={item.href} className="home-post-card group">
      <div className="home-post-card-thumb">
        {item.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumb}
            alt={`${item.title} 썸네일`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="home-post-card-fallback" aria-hidden>
            {fallbackIcon}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="board-post-title board-post-title-clamp text-sm font-semibold text-stone-800 group-hover:text-signature-dark">
          {item.title}
        </p>
        <div className="home-post-card-meta mt-1.5">
          <span className="home-post-card-cat">{item.category}</span>
          {item.commentCount > 0 && <span>댓글 {item.commentCount}</span>}
          <span className="ml-auto">{formatBoardDate(item.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

export default async function HomePostFeed() {
  const [boardPosts, galleryPosts] = await Promise.all([
    readBoardPosts(),
    readGalleryPosts(),
  ]);

  const posts = buildHomeFeedItems({
    boardPosts,
    galleryPosts,
    sort: "latest",
    limit: 12,
  });

  return (
    <section className="portal-panel home-reveal overflow-hidden">
      <div className="portal-panel-head">
        <h2 className="portal-panel-title">최신 게시글</h2>
        <Link href="/board" className="portal-panel-more">
          전체보기
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="px-3 py-8 text-center text-sm text-slate-500">
          아직 게시글이 없습니다.
        </p>
      ) : (
        <div className="home-card-grid">
          {posts.map((post) => (
            <FeedCard key={post.key} item={post} />
          ))}
        </div>
      )}
    </section>
  );
}
