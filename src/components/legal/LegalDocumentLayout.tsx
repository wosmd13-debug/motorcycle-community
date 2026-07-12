import Link from "next/link";
import { legalDocuments, siteLegalInfo } from "@/lib/site-legal";

type LegalDocumentLayoutProps = {
  title: string;
  children: React.ReactNode;
};

export default function LegalDocumentLayout({
  title,
  children,
}: LegalDocumentLayoutProps) {
  return (
    <div className="portal-page py-8">
      <div className="portal-container mx-auto max-w-3xl">
        <nav className="mb-6 text-xs text-stone-500">
          <Link href="/" className="hover:text-signature-dark hover:underline">
            홈
          </Link>
          <span className="mx-2">/</span>
          <Link href="/legal" className="hover:text-signature-dark hover:underline">
            법적 고지
          </Link>
          <span className="mx-2">/</span>
          <span className="text-stone-700">{title}</span>
        </nav>

        <header className="portal-panel mb-6 p-6">
          <h1 className="text-2xl font-bold text-stone-800">{title}</h1>
          <p className="mt-2 text-sm text-stone-500">
            {siteLegalInfo.serviceName} · 시행일 {siteLegalInfo.effectiveDate}{" "}
            · 최종 수정 {siteLegalInfo.lastUpdated}
          </p>
        </header>

        <article className="portal-panel legal-prose p-6 sm:p-8">{children}</article>

        <aside className="mt-6 portal-panel p-5">
          <h2 className="text-sm font-bold text-stone-800">관련 문서</h2>
          <ul className="mt-3 space-y-2">
            {legalDocuments.map((doc) => (
              <li key={doc.href}>
                <Link
                  href={doc.href}
                  className="text-sm font-medium text-signature-dark hover:underline"
                >
                  {doc.title}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-stone-500">
            문의:{" "}
            <a
              href={`mailto:${siteLegalInfo.contactEmail}`}
              className="text-signature-dark hover:underline"
            >
              {siteLegalInfo.contactEmail}
            </a>
          </p>
        </aside>
      </div>
    </div>
  );
}
