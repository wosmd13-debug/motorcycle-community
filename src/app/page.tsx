import HomeBikeCategories from "@/components/portal/HomeBikeCategories";
import HomeDiscoverMenu from "@/components/portal/HomeDiscoverMenu";
import HomeHero from "@/components/portal/HomeHero";
import HomePostFeed from "@/components/portal/HomePostFeed";
import HomePromoPreview from "@/components/portal/HomePromoPreview";
import HomeQuickMenu from "@/components/portal/HomeQuickMenu";
import HomeSidebar from "@/components/portal/HomeSidebar";
import HomeTodayHot from "@/components/portal/HomeTodayHot";
import HomeVideosFeatured from "@/components/portal/HomeVideosFeatured";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="portal-page">
      <div className="portal-container portal-layout">
        <div className="min-w-0 space-y-3 sm:space-y-4">
          <HomeHero />
          <HomeTodayHot />
          <HomePostFeed />
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
