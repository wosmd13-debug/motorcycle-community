import Link from "next/link";
import {
  formatHomeRelativeTime,
  isHomeFeedItemNew,
  type HomeFeedItem,
} from "@/lib/home-feed";

type HomePostFeedProps = {
  posts: HomeFeedItem[];
};

function LatestRow({ item }: { item: HomeFeedItem }) {
  const isNew = isHomeFeedItemNew(item.createdAt);

  return (
    <Link href={item.href} className="home-latest-row home-latest-item group">
      <div className="home-latest-main min-w-0">
        <span className="home-post-card-cat shrink-0">{item.category}</span>
        {isNew && <span className="home-latest-new">NEW</span>}
        <span className="board-post-title board-post-title-clamp home-latest-title group-hover:text-signature-dark">
          {item.title}
        </span>
      </div>
      <div className="home-latest-meta shrink-0">
        {item.commentCount > 0 && (
          <span className="home-hot-comments">[{item.commentCount}]</span>
        )}
        <time dateTime={item.createdAt}>
          {formatHomeRelativeTime(item.createdAt)}
        </time>
      </div>
    </Link>
  );
}

export default function HomePostFeed({ posts }: HomePostFeedProps) {
  return (
    <section
      id="latest-posts"
      className="portal-panel home-reveal overflow-hidden"
    >
      <div className="portal-panel-head">
        <h2 className="portal-panel-title">최신 게시글</h2>
        <Link href="/board" className="portal-panel-more">
          전체보기
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="home-empty-state">
          <p className="home-empty-state-title">아직 게시글이 없습니다</p>
          <p className="home-empty-state-copy">첫 글을 남겨 주세요.</p>
          <Link href="/board" className="home-hero-cta home-hero-cta-primary">
            자유게시판 가기
          </Link>
        </div>
      ) : (
        <div className="home-latest-list">
          {posts.map((post) => (
            <LatestRow key={post.key} item={post} />
          ))}
        </div>
      )}
    </section>
  );
}
