import Link from "next/link";
import { filterBoardPosts, formatBoardDate, type BoardPost } from "@/lib/board";
import { readBoardPosts } from "@/lib/board-store";

function PostRow({ post }: { post: BoardPost }) {
  const thumb = post.imageUrls[0];

  return (
    <Link href={`/board/${post.id}`} className="portal-post-row group">
      {thumb ? (
        <div className="relative h-11 w-11 shrink-0 overflow-hidden border border-signature/20 bg-signature-light ring-1 ring-signature/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-signature/20 bg-signature-light text-lg leading-none text-signature-dark">
            📝
          </div>
      )}

      <p className="min-w-0 flex-1 truncate text-sm text-stone-800 group-hover:text-signature-dark">
        {post.title}
      </p>

      {post.comments.length > 0 && (
        <span className="portal-comment-count">[{post.comments.length}]</span>
      )}

      <span className="hidden w-14 shrink-0 truncate text-[11px] font-medium text-signature-dark/80 sm:inline">
        {post.category}
      </span>
      <span className="portal-meta hidden w-16 text-right md:inline">
        {formatBoardDate(post.createdAt)}
      </span>
    </Link>
  );
}

export default async function HomePostFeed() {
  const posts = filterBoardPosts({
    posts: await readBoardPosts(),
    sort: "latest",
  }).slice(0, 20);

  return (
    <section className="portal-panel overflow-hidden">
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
        <div>
          {posts.map((post) => (
            <PostRow key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
