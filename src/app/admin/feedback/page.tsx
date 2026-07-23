import { redirect } from "next/navigation";
import AdminFeedbackExplorer from "@/components/admin/AdminFeedbackExplorer";
import { isAdminUser } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth-server";
import { readFeedback } from "@/lib/feedback-store";

export default async function AdminFeedbackPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/admin/feedback");
  }

  if (!isAdminUser(user)) {
    redirect("/");
  }

  const feedback = await readFeedback();
  const pendingCount = feedback.filter(
    (entry) => entry.status === "pending"
  ).length;

  return (
    <div className="portal-page py-4">
      <div className="portal-container mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-sm font-semibold text-signature-dark">운영자</p>
          <h1 className="mt-2 text-3xl font-bold text-stone-800">
            건의·문의 관리
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            접수된 건의·문의를 검토합니다. 대기 {pendingCount}건
          </p>
        </div>

        <AdminFeedbackExplorer initialFeedback={feedback} />
      </div>
    </div>
  );
}
