import Link from "next/link";
import PromoBusinessInfoSummary from "@/components/promo/PromoBusinessInfoSummary";
import PromoMedia from "@/components/promo/PromoMedia";
import {
  filterPromoPosts,
  formatPromoDate,
  getPromoCoverImage,
  hasPromoBusinessInfo,
  isPromoBanner,
} from "@/lib/promo";
import { readPromoPosts } from "@/lib/promo-store";

export default async function HomePromoPreview() {
  const posts = filterPromoPosts({
    posts: await readPromoPosts(),
    sort: "latest",
  }).slice(0, 8);

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="portal-panel overflow-hidden">
      <div className="portal-panel-head">
        <div className="flex items-center gap-2">
          <h2 className="portal-panel-title">업체 홍보</h2>
          <span className="portal-badge">AD</span>
        </div>
        <Link href="/promo" className="portal-panel-more">
          전체보기
        </Link>
      </div>
      <p className="border-b border-red-100 bg-red-50/50 px-3 py-2 text-[11px] leading-4 text-red-800">
        음란물·불법 촬영물·사기·허위광고 등 불법 홍보는 등록할 수 없습니다.
      </p>

      <div>
        {posts.map((post) => {
          const cover = getPromoCoverImage(post);

          return (
            <Link
              key={post.id}
              href={`/promo/${post.id}`}
              className="portal-post-row group"
            >
              {cover ? (
                <div
                  className={`relative shrink-0 overflow-hidden rounded-md bg-stone-100 ${
                    isPromoBanner(post)
                      ? "hidden h-10 w-20 sm:block"
                      : "hidden h-10 w-14 sm:block"
                  }`}
                >
                  <PromoMedia
                    src={cover}
                    alt=""
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <span
                  className={`hidden shrink-0 sm:inline ${
                    isPromoBanner(post) ? "w-20" : "w-14"
                  }`}
                />
              )}
              <span className="hidden w-20 shrink-0 truncate text-[11px] font-semibold text-signature-darker sm:inline">
                {post.category}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-stone-800 group-hover:text-signature-dark">
                  {isPromoBanner(post) && (
                    <span className="mr-1 rounded bg-signature-muted px-1.5 py-0.5 text-[10px] font-bold text-signature-darker">
                      배너
                    </span>
                  )}
                  {post.title}
                </p>
                {hasPromoBusinessInfo(post) && (
                  <PromoBusinessInfoSummary post={post} variant="inline" />
                )}
              </div>
              {post.comments.length > 0 && (
                <span className="portal-comment-count">[{post.comments.length}]</span>
              )}
              <span className="portal-meta hidden w-16 text-right md:inline">
                {formatPromoDate(post.createdAt)}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
