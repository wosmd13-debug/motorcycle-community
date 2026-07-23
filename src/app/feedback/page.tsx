import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import { isOperatorUser } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth-server";

export default async function FeedbackPage() {
  const user = await getCurrentUser();
  if (user && isOperatorUser(user)) {
    redirect("/admin/feedback");
  }

  return (
    <div className="portal-page py-4">
      <div className="portal-container mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="건의·문의"
          description="버그 신고, 기능 건의, 이용 문의, 불편 신고를 접수합니다. 사이트 접수 또는 이메일로 보내실 수 있습니다."
        />
        <FeedbackForm />
      </div>
    </div>
  );
}
