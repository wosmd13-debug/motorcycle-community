import type { Metadata } from "next";
import HomeBikeCategories from "@/components/portal/HomeBikeCategories";
import HomeDiscoverMenu from "@/components/portal/HomeDiscoverMenu";
import HomeHero from "@/components/portal/HomeHero";
import HomePrimaryFeed from "@/components/portal/HomePrimaryFeed";
import HomePromoPreview from "@/components/portal/HomePromoPreview";
import HomeQuickMenu from "@/components/portal/HomeQuickMenu";
import HomeSidebar from "@/components/portal/HomeSidebar";
import HomeTodaysBike from "@/components/portal/HomeTodaysBike";
import HomeTodaysRiding from "@/components/portal/HomeTodaysRiding";
import HomeVideosFeatured from "@/components/portal/HomeVideosFeatured";
import JsonLd from "@/components/seo/JsonLd";
import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  absoluteUrl,
  buildPageMetadata,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description: DEFAULT_DESCRIPTION,
  path: "/",
});

const homeItemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: `${SITE_NAME} 주요 메뉴`,
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "자유게시판", url: absoluteUrl("/board") },
    { "@type": "ListItem", position: 2, name: "라이딩 모집", url: absoluteUrl("/meetups") },
    { "@type": "ListItem", position: 3, name: "바리 코스", url: absoluteUrl("/routes") },
    { "@type": "ListItem", position: 4, name: "주유소", url: absoluteUrl("/services") },
    { "@type": "ListItem", position: 5, name: "네이버 지도", url: absoluteUrl("/map") },
    { "@type": "ListItem", position: 6, name: "갤러리", url: absoluteUrl("/gallery") },
    { "@type": "ListItem", position: 7, name: "중고거래", url: absoluteUrl("/marketplace") },
  ],
};

export default function Home() {
  return (
    <div className="portal-page">
      <JsonLd data={homeItemListJsonLd} />
      <div className="portal-container portal-layout">
        <div className="min-w-0 space-y-3 sm:space-y-4">
          <HomeHero />
          <HomePrimaryFeed />
          <HomeTodaysRiding />
          <HomeTodaysBike />
          <HomeBikeCategories />
          <HomeDiscoverMenu />
          <HomeVideosFeatured />
          <HomePromoPreview />
          <HomeQuickMenu />
        </div>

        <HomeSidebar />
      </div>
    </div>
  );
}
