import { NextRequest, NextResponse } from "next/server";
import { getMemberRankings } from "@/lib/ranking-server";
import type { MemberGradeId } from "@/lib/ranking";

const gradeIds: MemberGradeId[] = [
  "beginner",
  "quarter",
  "middle",
  "liter",
  "hyper",
  "operator",
];

function parseGrade(value: string | null): MemberGradeId | "all" {
  if (!value || value === "all") return "all";
  return gradeIds.includes(value as MemberGradeId)
    ? (value as MemberGradeId)
    : "all";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const grade = parseGrade(searchParams.get("grade"));
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") ?? "50"), 1),
      100
    );

    const rankings = await getMemberRankings({ grade, limit });
    return NextResponse.json({ rankings });
  } catch {
    return NextResponse.json(
      { error: "회원 랭킹을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
