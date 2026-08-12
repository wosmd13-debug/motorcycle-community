import PageHeader from "@/components/PageHeader";
import BikeGarageClient from "@/components/garage/BikeGarageClient";

export default function GaragePage() {
  return (
    <div className="portal-page py-4">
      <div className="portal-container mx-auto max-w-3xl space-y-4">
        <PageHeader
          title="내 차고"
          description="정비 일지를 남기고, 현재 주행거리 기준으로 오일·체인·타이어·브레이크 주기를 확인하세요."
        />
        <BikeGarageClient />
      </div>
    </div>
  );
}
