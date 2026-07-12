import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth-server";
import { deleteContentByTarget } from "@/lib/content-delete";
import { resolveReportsForTarget } from "@/lib/report-store";
import { reportTargetTypes, type ReportTargetType } from "@/lib/reports";

export async function POST(request: NextRequest) {
  const admin = await requireAdminFromRequest(request);
  if (admin instanceof NextResponse) return admin;

  try {
    const body = await request.json();
    const targetType = String(body.targetType ?? "") as ReportTargetType;
    const targetId = String(body.targetId ?? "").trim();
    const adminNote = String(body.adminNote ?? "").trim();

    if (!reportTargetTypes.includes(targetType)) {
      return NextResponse.json(
        { error: "유효하지 않은 삭제 대상입니다." },
        { status: 400 }
      );
    }

    if (!targetId) {
      return NextResponse.json(
        { error: "삭제 대상 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const deleted = await deleteContentByTarget(targetType, targetId);
    if (!deleted) {
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    await resolveReportsForTarget(
      targetType,
      targetId,
      adminNote || "관리자에 의해 게시물이 삭제되었습니다."
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "게시물 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
