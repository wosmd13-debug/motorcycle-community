import { redirect } from "next/navigation";
import AdminReportsExplorer from "@/components/admin/AdminReportsExplorer";
import { isAdminUser } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth-server";
import { readReports } from "@/lib/report-store";

export default async function AdminReportsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/admin/reports");
  }

  if (!isAdminUser(user)) {
    redirect("/");
  }

  const reports = await readReports();
  const pendingCount = reports.filter(
    (report) => report.status === "pending"
  ).length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-signature-dark">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold text-stone-800">신고 관리</h1>
        <p className="mt-2 text-sm text-stone-500">
          접수된 신고를 검토하고 게시물을 삭제하거나 기각할 수 있습니다.
          {pendingCount > 0 && (
            <span className="ml-2 font-semibold text-red-600">
              대기 {pendingCount}건
            </span>
          )}
        </p>
      </div>

      <AdminReportsExplorer initialReports={reports} />
    </main>
  );
}
