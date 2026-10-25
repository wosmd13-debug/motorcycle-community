import { redirect } from "next/navigation";
import PixelTown from "@/components/admin/PixelTown";
import { isOperatorUser } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth-server";
import { buildTownSnapshot } from "@/lib/ops-town";

export const metadata = {
  title: "라이더 마을 현황",
  robots: { index: false, follow: false },
};

export default async function AdminTownPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/admin/town");
  }

  if (!isOperatorUser(user)) {
    redirect("/");
  }

  const snapshot = await buildTownSnapshot();

  return (
    <div className="portal-page py-4">
      <div className="portal-container mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-sm font-semibold text-signature-dark">운영자</p>
          <h1 className="mt-2 text-3xl font-bold text-stone-800">라이더 마을 현황</h1>
          <p className="mt-2 text-sm text-stone-500">
            커뮤니티 활동을 픽셀 마을로 보여줍니다. 건물을 누르면 소식이, 퀘스트를 누르면 해당 글로 이동합니다.
          </p>
        </div>

        <PixelTown snapshot={snapshot} />
      </div>
    </div>
  );
}
