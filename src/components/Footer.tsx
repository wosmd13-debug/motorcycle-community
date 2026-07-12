import Link from "next/link";

import { legalDocuments, siteLegalInfo } from "@/lib/site-legal";



export default function Footer() {

  return (

    <footer className="safe-bottom mt-auto w-full border-t-2 border-signature/30 bg-gradient-to-b from-signature-light/50 to-[var(--portal-muted)]">

      <div className="portal-container py-8">

        <div className="text-center">

          <p className="text-sm font-bold">

            <span className="text-signature">바이크</span>

            <span className="text-[var(--text-primary)]">커뮤니티</span>

          </p>

          <p className="mt-1 text-xs text-[var(--text-muted)]">

            오토바이 라이더를 위한 커뮤니티

          </p>

        </div>



        <nav

          className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-[var(--text-secondary)]"

          aria-label="법적 고지"

        >

          {legalDocuments.map((doc, index) => (

            <span key={doc.href} className="inline-flex items-center gap-3">

              {index > 0 && <span className="text-[var(--text-faint)]" aria-hidden>|</span>}

              <Link

                href={doc.href}

                className="font-medium text-[var(--text-primary)] hover:text-signature-dark hover:underline"

              >

                {doc.title}

              </Link>

            </span>

          ))}

        </nav>



        <nav className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--text-muted)]">

          <Link href="/cafes" className="hover:text-signature-dark hover:underline">

            바이크 카페 등록

          </Link>

          <span className="text-[var(--text-faint)]">·</span>

          <Link href="/partners" className="hover:text-signature-dark hover:underline">

            제휴·홍보

          </Link>

          <span className="text-[var(--text-faint)]">·</span>

          <Link href="/board" className="hover:text-signature-dark hover:underline">

            자유게시판

          </Link>

        </nav>



        <div className="mt-6 border-t border-signature/15 pt-5 text-center text-[11px] leading-6 text-[var(--text-muted)]">

          <p>

            <span className="font-semibold text-[var(--text-secondary)]">운영자</span>{" "}

            {siteLegalInfo.operatorName}

            {" · "}

            <span className="font-semibold text-[var(--text-secondary)]">문의</span>{" "}

            <a

              href={`mailto:${siteLegalInfo.contactEmail}`}

              className="text-signature-dark hover:underline"

            >

              {siteLegalInfo.contactEmail}

            </a>

          </p>

          <p className="mt-1">

            본 웹사이트에 게시된 이메일 주소가 전자우편 수집 프로그램이나 그 밖의

            기술적 장치를 이용하여 무단으로 수집되는 것을 거부하며, 위반 시

            「정보통신망 이용촉진 및 정보보호 등에 관한 법률」에 따라 형사 처벌될

            수 있습니다.

          </p>

          <p className="mt-3 text-[var(--text-faint)]">

            © {new Date().getFullYear()} {siteLegalInfo.serviceNameEn}. All rights

            reserved.

          </p>

        </div>

      </div>

    </footer>

  );

}


