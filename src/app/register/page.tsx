import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import RegisterPageClient from "@/components/auth/RegisterPageClient";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "회원가입",
  description: "Byanra 바이크 커뮤니티 회원가입",
  path: "/register",
  noIndex: true,
});

export default function RegisterPage() {
  return (
    <div className="portal-page py-4">
      <div className="portal-container mx-auto max-w-md space-y-4">
        <PageHeader
          title="회원가입"
          description="아이디와 닉네임을 등록하면 게시글·댓글·홍보 등록 시 본인 닉네임으로 활동할 수 있습니다."
        />
        <RegisterPageClient />
      </div>
    </div>
  );
}
