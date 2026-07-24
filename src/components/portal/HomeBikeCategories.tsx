import Link from "next/link";
import { BIKE_BRANDS, getBikeBrandHref } from "@/lib/home-portal";

export default function HomeBikeCategories() {
  return (
    <section className="portal-panel home-reveal overflow-hidden">
      <div className="portal-panel-head">
        <div className="flex items-center gap-2">
          <h2 className="portal-panel-title">차종별 바로가기</h2>
        </div>
        <Link href="/board" className="portal-panel-more">
          게시판
        </Link>
      </div>
      <div className="home-brand-grid">
        {BIKE_BRANDS.map((brand) =>
          brand.comingSoon ? (
            <span
              key={brand.id}
              className="home-brand-chip is-disabled opacity-70"
              aria-disabled
            >
              {brand.label}
              <span className="ml-1 text-[10px] font-bold text-signature-dark">
                준비중
              </span>
            </span>
          ) : (
            <Link
              key={brand.id}
              href={getBikeBrandHref(brand)}
              className="home-brand-chip"
            >
              {brand.label}
            </Link>
          )
        )}
      </div>
    </section>
  );
}
