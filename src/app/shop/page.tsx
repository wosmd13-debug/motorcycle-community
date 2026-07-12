import PageHeader from "@/components/PageHeader";
import ShopExplorer from "@/components/shop/ShopExplorer";
import { getCurrentUser } from "@/lib/auth-server";
import { getShopDashboard } from "@/lib/shop-server";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const user = await getCurrentUser();
  const dashboard = user ? await getShopDashboard(user.id) : null;

  return (
    <div className="portal-page">
      <div className="portal-container space-y-4">
        <PageHeader
          title="포인트 상점"
          description="미션으로 모은 포인트로 닉네임·프레임·칭호·부스트를 구매하세요. 랭킹 점수는 차감되지 않습니다."
        />
        <ShopExplorer
          initialDashboard={dashboard}
          initialRequiresAuth={!user}
        />
      </div>
    </div>
  );
}
