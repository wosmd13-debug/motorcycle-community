import PageHeader from "@/components/PageHeader";
import PartnerRegistrationForm, {
  PartnerPlacePreview,
  PartnerPlanCards,
} from "@/components/partners/PartnerRegistrationForm";
import { readBariRoutes } from "@/lib/bari-route-store";

export default async function PartnersPage() {
  const bariRoutes = await readBariRoutes();

  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <PageHeader
          title="제휴·홍보"
          description="바이크 카페·식당·정비소·숙박업소 사장님들이 바리 코스 라이더들에게 매장을 알릴 수 있는 공간입니다."
        />

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800">왜 Byanra인가요?</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "타깃이 명확해요",
                text: "바리 코스를 찾는 실제 라이더들에게 노출됩니다.",
              },
              {
                title: "코스와 연결",
                text: "코스 상세·지도에 카페·휴식 스팟으로 등록됩니다.",
              },
              {
                title: "혜택 홍보",
                text: "할인·이벤트를 코스 페이지에서 바로 안내할 수 있어요.",
              },
            ].map((item) => (
              <div key={item.title} className="portal-panel p-5">
                <h3 className="font-bold text-slate-800">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-800">홍보 플랜</h2>
          <p className="mt-2 text-sm text-slate-500">
            추후 결제·관리자 승인 기능과 연결될 예정입니다.
          </p>
          <div className="mt-6">
            <PartnerPlanCards />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-800">제휴 매장 예시</h2>
          <p className="mt-2 text-sm text-slate-500">
            코스 페이지에서 이렇게 노출됩니다.
          </p>
          <div className="mt-6">
            <PartnerPlacePreview />
          </div>
        </section>

        <section className="mt-10" id="apply">
          <h2 className="text-xl font-bold text-slate-800">입점·홍보 신청</h2>
          <p className="mt-2 text-sm text-slate-500">
            아래 양식은 데모입니다. 추후 사장님 계정과 연결됩니다.
          </p>
          <div className="mt-6">
            <PartnerRegistrationForm bariRoutes={bariRoutes} />
          </div>
        </section>
      </div>
    </div>
  );
}
