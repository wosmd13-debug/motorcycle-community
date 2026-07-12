import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { legalDocuments, siteLegalInfo } from "@/lib/site-legal";

export default function LegalIndexPage() {
  return (
    <div className="portal-page py-4">
      <div className="portal-container mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="법적 고지"
          description={`${siteLegalInfo.serviceName} 서비스 이용과 관련된 약관 및 정책입니다. 배포·운영 전 내용을 확인하고 필요 시 법률 전문가 검토를 권장합니다.`}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {legalDocuments.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              className="portal-panel block p-5 transition hover:ring-2 hover:ring-signature/30"
            >
              <h2 className="font-bold text-stone-800">{doc.title}</h2>
              <p className="mt-2 text-sm text-stone-500">{doc.description}</p>
            </Link>
          ))}
        </div>

        <section className="portal-panel p-5 text-sm text-stone-600">
          <h2 className="font-bold text-stone-800">운영자 정보</h2>
          <dl className="mt-3 space-y-2">
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-stone-500">서비스명</dt>
              <dd>{siteLegalInfo.serviceName}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-stone-500">운영자</dt>
              <dd>{siteLegalInfo.operatorName}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-stone-500">문의</dt>
              <dd>
                <a
                  href={`mailto:${siteLegalInfo.contactEmail}`}
                  className="text-signature-dark hover:underline"
                >
                  {siteLegalInfo.contactEmail}
                </a>
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
