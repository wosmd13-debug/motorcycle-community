import PageHeader from "@/components/PageHeader";
import BikeGarageClient from "@/components/garage/BikeGarageClient";

export default function GaragePage() {
  return (
    <div className="portal-page py-4">
      <div className="portal-container mx-auto max-w-3xl space-y-4">
        <PageHeader
          title="내 차고"
          description="바이크 정보와 정비 일지를 기록하고, 오일·체인·타이어 교환 주기를 km 기준으로 확인하세요."
        />
        <BikeGarageClient />
      </div>
    </div>
  );
}
