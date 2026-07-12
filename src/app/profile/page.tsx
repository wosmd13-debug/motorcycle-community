import PageHeader from "@/components/PageHeader";
import ProfilePageClient from "@/components/auth/ProfilePageClient";

export default function ProfilePage() {
  return (
    <div className="portal-page py-4">
      <div className="portal-container mx-auto max-w-2xl space-y-4">
        <PageHeader
          title="회원 정보 수정"
          description="닉네임과 비밀번호를 변경할 수 있습니다. 닉네임을 바꾸면 기존에 작성한 글·댓글의 표시 이름도 함께 업데이트됩니다."
        />
        <ProfilePageClient />
      </div>
    </div>
  );
}
