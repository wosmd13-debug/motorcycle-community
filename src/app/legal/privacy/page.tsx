import type { Metadata } from "next";
import LegalDocumentLayout from "@/components/legal/LegalDocumentLayout";
import { siteLegalInfo } from "@/lib/site-legal";

export const metadata: Metadata = {
  title: `개인정보처리방침 | ${siteLegalInfo.serviceName}`,
  description: `${siteLegalInfo.serviceName} 개인정보처리방침`,
};

export default function PrivacyPage() {
  const { serviceName, operatorName, contactEmail, siteUrl } = siteLegalInfo;

  return (
    <LegalDocumentLayout title="개인정보처리방침">
      <section>
        <p>
          {operatorName}(이하 &quot;운영자&quot;)는 {serviceName} 서비스(이하
          &quot;서비스&quot;, {siteUrl}) 이용과 관련하여 「개인정보 보호법」 등
          관련 법령을 준수하며, 이용자의 개인정보를 보호하기 위해 다음과 같이
          개인정보처리방침을 수립·공개합니다.
        </p>
      </section>

      <section>
        <h2>1. 수집하는 개인정보 항목 및 방법</h2>
        <h3>① 회원가입·로그인</h3>
        <ul>
          <li>필수: 아이디(로그인 ID), 닉네임, 비밀번호(암호화 저장)</li>
          <li>
            수집 방법: 회원가입·로그인 화면 입력, 서비스 이용 과정 자동
            생성(세션 쿠키)
          </li>
        </ul>
        <h3>② 서비스 이용 과정</h3>
        <ul>
          <li>게시물·댓글 작성 시: 닉네임, 작성 내용, 작성 일시</li>
          <li>신고 기능 이용 시: 신고자 ID, 신고 사유, 대상 게시물 정보</li>
          <li>
            건의·문의 접수 시: 문의 내용, 연락용 이메일(입력한 경우), 관련
            페이지 URL
          </li>
          <li>
            자동 수집: 세션 쿠키(로그인 유지), 요청 처리용 일시적 IP 식별(남용
            방지·요청 제한, 서버 메모리에만 짧게 사용하며 별도 접속 로그로 장기
            저장하지 않음)
          </li>
        </ul>
        <h3>③ 서비스 이용 통계·UX 분석(자동 수집)</h3>
        <p>
          운영자는 서비스 개선을 위해 아래 분석 도구를 사용하며, 이용자가
          서비스를 이용하는 과정에서 아래 정보가 해당 제공업체의 기술(쿠키·유사
          기술 포함)을 통해 자동으로 수집·처리될 수 있습니다.
        </p>
        <ul>
          <li>
            <strong>Google Analytics 4 (GA4)</strong>: 방문·페이지뷰·이벤트 등
            이용 통계, 기기·브라우저·대략적 지역 정보 등(제공업체가 처리하는
            범위에 따름)
          </li>
          <li>
            <strong>Microsoft Clarity</strong>: 클릭·스크롤 등 이용 행태, 세션
            리플레이·히트맵 등 UX 분석에 필요한 정보(제공업체가 처리하는 범위에
            따름)
          </li>
        </ul>
      </section>

      <section>
        <h2>2. 개인정보의 수집·이용 목적</h2>
        <ul>
          <li>회원 식별, 로그인 유지, 본인 게시물 관리</li>
          <li>
            커뮤니티 서비스 제공(자유게시판, 갤러리, 홍보, 카페 등록 등)
          </li>
          <li>불법·유해 게시물 신고 처리 및 운영자 moderation</li>
          <li>서비스 부정 이용 방지, 보안</li>
          <li>
            방문 통계·이용 현황 분석 및 서비스 개선(Google Analytics 4)
          </li>
          <li>
            이용자 경험(UX) 개선을 위한 행태 분석(Microsoft Clarity: 클릭,
            스크롤, 세션 리플레이 등)
          </li>
          <li>문의·민원 처리</li>
        </ul>
      </section>

      <section>
        <h2>3. 개인정보의 보유 및 이용 기간</h2>
        <ul>
          <li>
            회원 정보: 회원 탈퇴 시까지 (관련 법령에 따라 일정 기간 보관할 수
            있음)
          </li>
          <li>
            게시물·댓글: 삭제 요청 또는 회원 탈퇴 후에도 다른 이용자 열람·법령상
            보관 의무에 따라 일부 보관될 수 있음
          </li>
          <li>신고 기록: 처리 완료 후 최대 1년 (분쟁 대응 목적)</li>
          <li>
            요청 제한용 IP 식별: 서버 메모리에서 짧게 사용 후 폐기 (별도 접속
            로그 파일로 장기 보관하지 않음)
          </li>
          <li>
            분석 도구(GA4, Clarity)를 통해 수집·처리되는 정보: 각 제공업체의
            정책 및 운영자가 설정한 보관 기간에 따름
          </li>
        </ul>
      </section>

      <section>
        <h2>4. 개인정보의 제3자 제공</h2>
        <p>
          운영자는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
          다만, 법령에 따른 요청이 있거나 이용자의 사전 동의가 있는 경우, 또는
          아래와 같이 서비스 제공·개선을 위해 필요한 범위에서 분석 도구
          제공업체에 정보가 처리되도록 하는 경우는 예외로 합니다.
        </p>
        <ul>
          <li>
            Google Analytics 4 운영을 위한 Google 관련 처리 (방문 통계·서비스
            개선 목적)
          </li>
          <li>
            Microsoft Clarity 운영을 위한 Microsoft 관련 처리 (UX 분석 목적)
          </li>
        </ul>
        <p className="mt-2">
          각 제공업체의 개인정보 처리에 관한 자세한 내용은 해당 업체의
          개인정보처리방침을 확인해 주세요.
        </p>
        <ul>
          <li>
            Google:{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://policies.google.com/privacy
            </a>
          </li>
          <li>
            Microsoft:{" "}
            <a
              href="https://privacy.microsoft.com/privacystatement"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://privacy.microsoft.com/privacystatement
            </a>
          </li>
        </ul>
      </section>

      <section>
        <h2>5. 개인정보 처리 위탁</h2>
        <p>
          운영자는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를
          위탁하거나, 이에 준하는 형태로 외부 인프라·도구를 이용할 수 있습니다.
        </p>
        <ul>
          <li>
            호스팅·서버 운영: 가비아 클라우드 VPS 및 가비아 호스팅 — 서비스
            서버 운영, 데이터 저장·백업
          </li>
          <li>
            이용 통계 분석: Google (Google Analytics 4) — 방문 통계 및 서비스
            개선을 위한 분석
          </li>
          <li>
            UX 분석: Microsoft (Microsoft Clarity) — 클릭·스크롤·세션 리플레이
            등 이용 행태 분석
          </li>
        </ul>
        <p className="mt-2">
          위탁 또는 외부 도구 이용 시, 관련 법령에 따라 개인정보가 안전하게
          관리되도록 필요한 조치를 합니다. 수탁자·이용 도구가 변경되는 경우 본
          방침을 통해 안내합니다.
        </p>
      </section>

      <section>
        <h2>6. 개인정보의 국외 이전</h2>
        <p>
          서비스 이용 과정에서 아래와 같이 개인정보(또는 이에 준하는 이용
          정보)가 국외로 이전·처리될 수 있습니다. 이전되는 정보는 각 도구가
          서비스 제공에 필요한 범위에 한정됩니다.
        </p>
        <ul>
          <li>
            <strong>Google (Google Analytics 4)</strong>: 방문·이용 통계 처리.
            이전 국가·보관 장소는 Google의 인프라·정책에 따릅니다. 자세한 내용:{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google 개인정보처리방침
            </a>
          </li>
          <li>
            <strong>Microsoft (Microsoft Clarity)</strong>: UX·행태 분석 처리.
            이전 국가·보관 장소는 Microsoft의 인프라·정책에 따릅니다. 자세한
            내용:{" "}
            <a
              href="https://privacy.microsoft.com/privacystatement"
              target="_blank"
              rel="noopener noreferrer"
            >
              Microsoft 개인정보처리방침
            </a>
          </li>
        </ul>
        <p className="mt-2">
          이용자는 브라우저 설정 등으로 쿠키·유사 기술을 제한할 수 있으며, 이
          경우 일부 분석 기능이 제한될 수 있습니다. 권리 행사·문의는{" "}
          {contactEmail} 또는 서비스 내 문의 기능을 이용해 주세요.
        </p>
      </section>

      <section>
        <h2>7. 이용자의 권리</h2>
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
        <h2>8. 쿠키의 사용</h2>
        <p>
          서비스는 원활한 이용과 서비스 개선을 위해 쿠키 및 이와 유사한 기술을
          사용할 수 있습니다.
        </p>
        <h3>① 필수 쿠키</h3>
        <ul>
          <li>
            로그인 세션 유지, 보안·부정 이용 방지 등 서비스 기본 기능에 필요한
            쿠키
          </li>
          <li>
            필수 쿠키를 차단하면 로그인 등 일부 기능 이용이 제한될 수 있습니다.
          </li>
        </ul>
        <h3>② 분석 쿠키</h3>
        <ul>
          <li>
            <strong>Google Analytics 4</strong>: 방문 통계 및 서비스 개선을 위한
            이용 현황 분석
          </li>
          <li>
            <strong>Microsoft Clarity</strong>: 클릭·스크롤·세션 리플레이 등 UX
            분석
          </li>
        </ul>
        <h3>③ 쿠키 차단·관리 방법</h3>
        <p>
          이용자는 브라우저 설정에서 쿠키 저장을 거부하거나 저장된 쿠키를 삭제할
          수 있습니다. 설정 방법은 브라우저(Chrome, Safari, Edge, Firefox 등)마다
          다르며, 각 브라우저의 「설정 &gt; 개인정보 및 보안(또는 쿠키)」 메뉴에서
          확인할 수 있습니다. 분석 쿠키를 차단하더라도 서비스의 기본 열람은
          가능하나, 통계·UX 분석의 정확도가 떨어질 수 있습니다.
        </p>
      </section>

      <section>
        <h2>9. 개인정보의 파기</h2>
        <p>
          보유 기간 경과 또는 처리 목적 달성 시 지체 없이 파기합니다. 전자적
          파일은 복구 불가능한 방법으로 삭제하고, 출력물은 분쇄 또는 소각합니다.
        </p>
      </section>

      <section>
        <h2>10. 개인정보 보호책임자</h2>
        <ul>
          <li>성명(또는 부서): {operatorName}</li>
          <li>연락처: {contactEmail}</li>
        </ul>
      </section>

      <section>
        <h2>11. 방침의 변경</h2>
        <p>
          본 방침이 변경되는 경우 변경 사유 및 적용일을 서비스 공지 또는 본
          페이지를 통해 안내합니다.
        </p>
      </section>
    </LegalDocumentLayout>
  );
}
