import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import LoginPageClient from "@/components/auth/LoginPageClient";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "로그인",
  description: "Byanra 바이크 커뮤니티 로그인",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return (
    <div className="portal-page py-4">
      <div className="portal-container mx-auto max-w-md space-y-4">
        <PageHeader
          title="로그인"
          description="로그인 후 글 작성, 댓글, 홍보 등록 등 커뮤니티 기능을 이용할 수 있습니다."
        />
        <LoginPageClient />
      </div>
    </div>
  );
}
