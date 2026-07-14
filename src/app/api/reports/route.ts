import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth-server";
import { getContentTitle } from "@/lib/content-delete";
import {
  createReport,
  readReports,
  resolveReportsForTarget,
  updateReportStatus,
} from "@/lib/report-store";
import {
  reportReasons,
  reportTargetTypes,
  type ReportReason,
  type ReportTargetType,
} from "@/lib/reports";
import { requireUserWithRateLimit } from "@/lib/request-guards";

export async function GET(request: NextRequest) {
  const admin = await requireAdminFromRequest(request);
  if (admin instanceof NextResponse) return admin;

  const status = request.nextUrl.searchParams.get("status");
  const reports = await readReports();

  const filtered =
    status === "pending" || status === "resolved" || status === "dismissed"
      ? reports.filter((report) => report.status === status)
      : reports;

  return NextResponse.json({ reports: filtered });
}

export async function POST(request: NextRequest) {
  const user = await requireUserWithRateLimit(request, "report");
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const targetType = String(body.targetType ?? "") as ReportTargetType;
    const targetId = String(body.targetId ?? "").trim();
    const reason = String(body.reason ?? "") as ReportReason;
    const detail = String(body.detail ?? "").trim();

    if (!reportTargetTypes.includes(targetType)) {
      return NextResponse.json(
        { error: "유효하지 않은 신고 대상입니다." },
        { status: 400 }
      );
    }

    if (!targetId) {
      return NextResponse.json(
        { error: "신고 대상을 찾을 수 없습니다." },
        { status: 400 }
      );
    }

    if (!reportReasons.includes(reason)) {
      return NextResponse.json(
        { error: "신고 사유를 선택해 주세요." },
        { status: 400 }
      );
    }

    const targetTitle =
      (await getContentTitle(targetType, targetId)) ?? "삭제된 게시물";

    const report = await createReport({
      reporterId: user.id,
      reporterNickname: user.nickname,
      targetType,
      targetId,
      targetTitle,
      reason,
      detail,
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_REPORTED") {
      return NextResponse.json(
        { error: "이미 접수된 신고입니다. 검토 중입니다." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "신고 접수에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdminFromRequest(request);
  if (admin instanceof NextResponse) return admin;

  try {
    const body = await request.json();
    const id = String(body.id ?? "").trim();
    const action = String(body.action ?? "");
    const adminNote = String(body.adminNote ?? "").trim();

    if (!id) {
      return NextResponse.json(
        { error: "신고 ID가 필요합니다." },
        { status: 400 }
      );
    }

    if (action === "dismiss") {
      const report = await updateReportStatus(id, "dismissed", adminNote);
      if (!report) {
        return NextResponse.json(
          { error: "신고를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({ report });
    }

    if (action === "resolve") {
      const report = await updateReportStatus(id, "resolved", adminNote);
      if (!report) {
        return NextResponse.json(
          { error: "신고를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({ report });
    }

    return NextResponse.json(
      { error: "유효하지 않은 처리 요청입니다." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "신고 처리에 실패했습니다." },
      { status: 500 }
    );
  }
}
