import type { Metadata } from "next";
import LegalDocumentLayout from "@/components/legal/LegalDocumentLayout";
import { siteLegalInfo } from "@/lib/site-legal";

export const metadata: Metadata = {
  title: `청소년 보호정책 | ${siteLegalInfo.serviceName}`,
  description: `${siteLegalInfo.serviceName} 청소년 보호정책`,
};

export default function YouthPolicyPage() {
  return (
    <LegalDocumentLayout title="청소년 보호정책">
      <section>
        <p>
          {siteLegalInfo.operatorName}(이하 &quot;운영자&quot;)는
          「청소년 보호법」 등 관련 법령에 따라 {siteLegalInfo.serviceName}
          서비스에서 청소년(만 19세 미만)이 유해 정보에 노출되지 않도록 다음과
          같은 보호 조치를 시행합니다.
        </p>
      </section>

      <section>
        <h2>1. 유해 정보에 대한 조치</h2>
        <ul>
          <li>음란·선정, 폭력, 사행성, 약물·범죄 조장 등 청소년 유해 정보 게시를 금지합니다.</li>
          <li>커뮤니티 운영정책 및 신고·관리자 검토를 통해 유해 게시물을 삭제합니다.</li>
          <li>자유홍보 등 민감 영역에는 금지 콘텐츠 경고 및 등록 전 규칙 동의를 적용합니다.</li>
        </ul>
      </section>

      <section>
        <h2>2. 회원 가입 연령</h2>
        <p>
          만 14세 미만 아동은 법정대리인 동의 없이 회원가입할 수 없습니다. 만
          19세 미만 청소년에게 부적합한 콘텐츠 노출을 최소화하기 위해 운영
          정책을 지속적으로 개선합니다.
        </p>
      </section>

      <section>
        <h2>3. 청소년 보호 책임자</h2>
        <ul>
          <li>성명(또는 부서): {siteLegalInfo.operatorName}</li>
          <li>연락처: {siteLegalInfo.contactEmail}</li>
        </ul>
        <p className="mt-2">
          청소년 유해 정보 신고 및 관련 문의는 위 연락처로 접수해 주세요.
        </p>
      </section>

      <section>
        <h2>4. 교육 및 모니터링</h2>
        <p>
          운영자는 관리자에게 청소년 보호 관련 지침을 안내하고, 신고 접수·검토
          절차를 통해 유해 정보 유통을 방지하기 위해 노력합니다.
        </p>
      </section>
    </LegalDocumentLayout>
  );
}
