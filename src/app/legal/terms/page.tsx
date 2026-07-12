import type { Metadata } from "next";
import LegalDocumentLayout from "@/components/legal/LegalDocumentLayout";
import { siteLegalInfo } from "@/lib/site-legal";

export const metadata: Metadata = {
  title: `이용약관 | ${siteLegalInfo.serviceName}`,
  description: `${siteLegalInfo.serviceName} 서비스 이용약관`,
};

export default function TermsPage() {
  const { serviceName, operatorName, contactEmail, siteUrl } = siteLegalInfo;

  return (
    <LegalDocumentLayout title="이용약관">
      <section>
        <h2>제1조 (목적)</h2>
        <p>
          본 약관은 {operatorName}(이하 &quot;운영자&quot;)가 제공하는 {serviceName}(
          {siteUrl}, 이하 &quot;서비스&quot;)의 이용과 관련하여 운영자와 회원 간
          권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section>
        <h2>제2조 (정의)</h2>
        <ol>
          <li>&quot;회원&quot;이란 본 약관에 동의하고 계정을 생성하여 서비스를 이용하는 자를 말합니다.</li>
          <li>&quot;게시물&quot;이란 회원이 서비스에 등록한 글, 댓글, 사진, 영상 링크, 홍보 정보 등 일체의 콘텐츠를 말합니다.</li>
          <li>&quot;비회원&quot;이란 회원 가입 없이 열람만 하는 이용자를 말합니다.</li>
        </ol>
      </section>

      <section>
        <h2>제3조 (약관의 게시와 개정)</h2>
        <ol>
          <li>운영자는 본 약관을 서비스 초기 화면 또는 연결 화면에 게시합니다.</li>
          <li>관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있으며, 개정 시 적용일 7일 전부터 공지합니다.</li>
          <li>회원이 개정 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
        </ol>
      </section>

      <section>
        <h2>제4조 (회원가입)</h2>
        <ol>
          <li>회원가입은 이용자가 약관 및 개인정보처리방침에 동의하고 가입 신청을 하며, 운영자가 이를 승낙함으로써 성립합니다.</li>
          <li>만 14세 미만 아동은 법정대리인의 동의 없이 가입할 수 없습니다.</li>
          <li>허위 정보 기재, 타인 명의 도용, 중복·부정 가입 등은 거절 또는 사후 탈퇴 처리될 수 있습니다.</li>
        </ol>
      </section>

      <section>
        <h2>제5조 (서비스의 제공)</h2>
        <p>운영자는 다음 서비스를 제공합니다.</p>
        <ul>
          <li>자유게시판, 갤러리, 영상, 자유홍보, 바이크 카페 등록 등 커뮤니티 기능</li>
          <li>바리 코스·지도·날씨 등 라이딩 정보 제공</li>
          <li>기타 운영자가 정하는 부가 서비스</li>
        </ul>
        <p>
          서비스는 연중무휴 제공을 원칙으로 하나, 시스템 점검·장애·천재지변 등 불가피한
          사유로 일시 중단될 수 있습니다.
        </p>
      </section>

      <section>
        <h2>제6조 (회원의 의무)</h2>
        <p>회원은 다음 행위를 하여서는 안 됩니다.</p>
        <ul>
          <li>타인의 개인정보·저작물·상표권 등 권리를 침해하는 행위</li>
          <li>음란물, 불법 촬영물, 사기·허위광고, 혐오·차별, 스팸 등 커뮤니티 운영정책 위반 행위</li>
          <li>서비스의 안정적 운영을 방해하거나 해킹·크롤링 등 비정상적 접근</li>
          <li>관련 법령 및 본 약관·운영정책을 위반하는 기타 행위</li>
        </ul>
      </section>

      <section>
        <h2>제7조 (게시물의 관리)</h2>
        <ol>
          <li>게시물의 저작권은 원칙적으로 작성자에게 귀속됩니다.</li>
          <li>회원은 서비스에 게시한 콘텐츠에 대해 운영·노출·백업·신고 처리 목적의 이용 허락을 합니다.</li>
          <li>운영자는 신고 접수, 법령 위반, 약관 위반 등 정당한 사유가 있는 경우 사전 통지 없이 게시물을 삭제하거나 노출을 제한할 수 있습니다.</li>
        </ol>
      </section>

      <section>
        <h2>제8조 (서비스 이용 제한 및 계정 해지)</h2>
        <p>
          운영자는 회원이 약관 또는 운영정책을 위반한 경우 경고, 일시 정지, 영구 이용
          제한, 게시물 삭제 등 필요한 조치를 할 수 있습니다. 회원은 언제든지 서비스
          내 기능 또는 {contactEmail}로 탈퇴를 요청할 수 있습니다.
        </p>
      </section>

      <section>
        <h2>제9조 (면책)</h2>
        <ol>
          <li>운영자는 회원 간 분쟁, 회원이 게시한 정보의 신뢰성·정확성에 대해 책임지지 않습니다.</li>
          <li>천재지변, 통신 장애, 제3자 서비스(지도·날씨·유튜브 등) 오류로 인한 손해에 대해 법령상 허용되는 범위 내에서 책임을 제한합니다.</li>
          <li>무료로 제공되는 서비스와 관련하여 법령에 특별한 규정이 없는 한 손해 배상 책임을 부담하지 않습니다.</li>
        </ol>
      </section>

      <section>
        <h2>제10조 (준거법 및 관할)</h2>
        <p>
          본 약관은 대한민국 법령에 따르며, 서비스 이용과 관련한 분쟁은 운영자
          소재지를 관할하는 법원을 제1심 관할 법원으로 합니다.
        </p>
      </section>

      <section>
        <h2>부칙</h2>
        <p>본 약관은 {siteLegalInfo.effectiveDate}부터 시행합니다.</p>
      </section>
    </LegalDocumentLayout>
  );
}
