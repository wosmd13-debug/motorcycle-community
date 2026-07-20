import HomeFeatured from "@/components/portal/HomeFeatured";
import HomePromoPreview from "@/components/portal/HomePromoPreview";
import HomePostFeed from "@/components/portal/HomePostFeed";
import HomeQuickMenu from "@/components/portal/HomeQuickMenu";
import HomeSidebar from "@/components/portal/HomeSidebar";
import HomeVideosFeatured from "@/components/portal/HomeVideosFeatured";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="portal-page">
      <div className="portal-container portal-layout">
        <div className="min-w-0 space-y-3 sm:space-y-4">
          <HomeFeatured />
          <HomePostFeed />
          <HomeVideosFeatured />
          <HomePromoPreview />
          <HomeQuickMenu />
        </div>

        <HomeSidebar />
      </div>
    </div>
  );
}
