import type { Metadata } from "next";
import LegalDocumentLayout from "@/components/legal/LegalDocumentLayout";
import { siteLegalInfo } from "@/lib/site-legal";

export const metadata: Metadata = {
  title: `개인정보처리방침 | ${siteLegalInfo.serviceName}`,
  description: `${siteLegalInfo.serviceName} 개인정보처리방침`,
};

export default function PrivacyPage() {
  const { serviceName, operatorName, contactEmail } = siteLegalInfo;

  return (
    <LegalDocumentLayout title="개인정보처리방침">
      <section>
        <p>
          {operatorName}(이하 &quot;운영자&quot;)는 {serviceName} 서비스(이하
          &quot;서비스&quot;) 이용과 관련하여 「개인정보 보호법」 등 관련 법령을
          준수하며, 이용자의 개인정보를 보호하기 위해 다음과 같이
          개인정보처리방침을 수립·공개합니다.
        </p>
      </section>

      <section>
        <h2>1. 수집하는 개인정보 항목 및 방법</h2>
        <h3>① 회원가입·로그인</h3>
        <ul>
          <li>필수: 아이디(로그인 ID), 닉네임, 비밀번호(암호화 저장)</li>
          <li>수집 방법: 회원가입·로그인 화면 입력, 서비스 이용 과정 자동 생성(세션 쿠키)</li>
        </ul>
        <h3>② 서비스 이용 과정</h3>
        <ul>
          <li>게시물·댓글 작성 시: 닉네임, 작성 내용, 작성 일시</li>
          <li>신고 기능 이용 시: 신고자 ID, 신고 사유, 대상 게시물 정보</li>
          <li>자동 수집: 세션 쿠키(로그인 유지), 요청 처리용 일시적 IP 식별(남용 방지·요청 제한, 서버 메모리에만 짧게 사용하며 별도 접속 로그로 장기 저장하지 않음)</li>
        </ul>
      </section>

      <section>
        <h2>2. 개인정보의 수집·이용 목적</h2>
        <ul>
          <li>회원 식별, 로그인 유지, 본인 게시물 관리</li>
          <li>커뮤니티 서비스 제공(자유게시판, 갤러리, 홍보, 카페 등록 등)</li>
          <li>불법·유해 게시물 신고 처리 및 운영자 moderation</li>
          <li>서비스 부정 이용 방지, 보안 및 통계 분석</li>
          <li>문의·민원 처리</li>
        </ul>
      </section>

      <section>
        <h2>3. 개인정보의 보유 및 이용 기간</h2>
        <ul>
          <li>회원 정보: 회원 탈퇴 시까지 (관련 법령에 따라 일정 기간 보관할 수 있음)</li>
          <li>게시물·댓글: 삭제 요청 또는 회원 탈퇴 후에도 다른 이용자 열람·법령상 보관 의무에 따라 일부 보관될 수 있음</li>
          <li>신고 기록: 처리 완료 후 최대 1년 (분쟁 대응 목적)</li>
          <li>요청 제한용 IP 식별: 서버 메모리에서 짧게 사용 후 폐기 (별도 접속 로그 파일로 장기 보관하지 않음)</li>
        </ul>
      </section>

      <section>
        <h2>4. 개인정보의 제3자 제공</h2>
        <p>
          운영자는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
          다만, 법령에 따른 요청이 있거나 이용자의 사전 동의가 있는 경우 예외로
          합니다.
        </p>
      </section>

      <section>
        <h2>5. 개인정보 처리 위탁</h2>
        <p>
          서비스 운영·호스팅·배포를 위해 클라우드·호스팅 사업자에게 서버 운영을
          위탁할 수 있습니다. 위탁 시 개인정보가 안전하게 관리되도록 계약 등
          필요한 조치를 합니다.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          ※ 호스팅·도메인 확정 후 위탁 업체·업무 내용을 본 방침에
          구체적으로 기재하세요.
        </p>
      </section>

      <section>
        <h2>6. 이용자의 권리</h2>
        <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
        <ul>
          <li>개인정보 열람·정정·삭제·처리 정지 요구</li>
          <li>회원 탈퇴(개인정보 삭제 요청)</li>
        </ul>
        <p>
          권리 행사는 {contactEmail} 또는 서비스 내 문의 기능을 통해 요청할 수
          있으며, 운영자는 지체 없이 조치합니다.
        </p>
      </section>

      <section>
        <h2>7. 쿠키의 사용</h2>
        <p>
          서비스는 로그인 세션 유지를 위해 쿠키를 사용합니다. 브라우저 설정에서
          쿠키 저장을 거부할 수 있으나, 이 경우 로그인 등 일부 기능 이용이
          제한될 수 있습니다.
        </p>
      </section>

      <section>
        <h2>8. 개인정보의 파기</h2>
        <p>
          보유 기간 경과 또는 처리 목적 달성 시 지체 없이 파기합니다. 전자적
          파일은 복구 불가능한 방법으로 삭제하고, 출력물은 분쇄 또는 소각
         합니다.
        </p>
      </section>

      <section>
        <h2>9. 개인정보 보호책임자</h2>
        <ul>
          <li>성명(또는 부서): {operatorName}</li>
          <li>연락처: {contactEmail}</li>
        </ul>
      </section>

      <section>
        <h2>10. 방침의 변경</h2>
        <p>
          본 방침이 변경되는 경우 변경 사유 및 적용일을 서비스 공지 또는 본
          페이지를 통해 안내합니다.
        </p>
      </section>
    </LegalDocumentLayout>
  );
}
