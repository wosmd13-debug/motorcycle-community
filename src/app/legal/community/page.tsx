import type { Metadata } from "next";
import LegalDocumentLayout from "@/components/legal/LegalDocumentLayout";
import { siteLegalInfo } from "@/lib/site-legal";

export const metadata: Metadata = {
  title: `커뮤니티 운영정책 | ${siteLegalInfo.serviceName}`,
  description: `${siteLegalInfo.serviceName} 커뮤니티 운영정책`,
};

export default function CommunityPolicyPage() {
  return (
    <LegalDocumentLayout title="커뮤니티 운영정책">
      <section>
        <p>
          {siteLegalInfo.serviceName}는 오토바이 라이더를 위한 건전한 정보
          공유 공간입니다. 본 정책은 자유게시판, 갤러리, 영상, 자유홍보,
          바이크 카페 등 모든 이용자 생성 콘텐츠(UGC)에 적용됩니다.
        </p>
      </section>

      <section>
        <h2>1. 기본 원칙</h2>
        <ul>
          <li>타인의 권리와 명예를 존중하고, 관련 법령을 준수합니다.</li>
          <li>라이딩·정비·장비·코스 등 건전한 정보 공유를 장려합니다.</li>
          <li>신고·관리자 검토를 통해 유해 콘텐츠를 신속히 처리합니다.</li>
        </ul>
      </section>

      <section>
        <h2>2. 금지 콘텐츠</h2>
        <p>다음에 해당하는 게시물·댓글·홍보는 등록이 제한되거나 삭제될 수 있습니다.</p>
        <ul>
          <li>음란물, 성적 수치심을 유발하는 내용</li>
          <li>불법 촬영물, 아동·청소년 성착취 관련 콘텐츠</li>
          <li>사기, 허위·과장 광고, 피라미드·불법 다단계 영업</li>
          <li>욕설, 비방, 혐오, 차별, 괴롭힘</li>
          <li>스팸, 도배, 무의미한 반복 게시, 타 사이트 강제 유입</li>
          <li>저작권·초상권·상표권 등 타인의 권리를 침해하는 내용</li>
          <li>불법 레이스 조장, 음주운전·무면허운전 조장, 교통법규 위반을 부추기는 내용</li>
          <li>개인정보(연락처, 주소 등) 무단 공개</li>
          <li>기타 관련 법령 또는 이용약관에 위반되는 내용</li>
        </ul>
      </section>

      <section>
        <h2>3. 자유홍보·영상·카페 등록</h2>
        <ul>
          <li>홍보·광고는 사실에 근거해야 하며, 허위·과장 표현을 금합니다.</li>
          <li>유튜브·외부 링크는 해당 플랫폼 이용약관 및 저작권을 준수해야 합니다.</li>
          <li>매장·카페 정보는 이용자가 직접 확인할 수 있도록 정확히 기재해야 합니다.</li>
          <li>자유홍보 등록 시 운영 규칙 동의가 필요합니다.</li>
        </ul>
      </section>

      <section>
        <h2>4. 신고 및 제재</h2>
        <ol>
          <li>이용자는 게시물 신고 기능을 통해 유해 콘텐츠를 신고할 수 있습니다.</li>
          <li>운영자(관리자)는 신고를 검토하여 게시물 삭제, 기각 등 조치를 할 수 있습니다.</li>
          <li>반복·중대한 위반 시 계정 이용 제한, 영구 정지 등 추가 제재가 이루어질 수 있습니다.</li>
        </ol>
      </section>

      <section>
        <h2>5. 저작권</h2>
        <p>
          회원이 업로드한 사진·글·영상 링크에 대한 책임은 작성자에게 있습니다.
          타인의 저작물을 무단으로 복제·배포하지 마십시오. 권리 침해 신고는{" "}
          {siteLegalInfo.contactEmail}로 접수합니다.
        </p>
      </section>

      <section>
        <h2>6. 정책 변경</h2>
        <p>
          서비스 운영상 필요한 경우 본 정책을 개정할 수 있으며, 변경 내용은
          서비스 내 공지합니다.
        </p>
      </section>
    </LegalDocumentLayout>
  );
}
