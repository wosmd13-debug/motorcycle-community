import { NextRequest, NextResponse } from "next/server";
import { getGradesByNicknames } from "@/lib/ranking-server";

type LookupRequestBody = {
  nicknames?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LookupRequestBody;
    const nicknames = Array.isArray(body.nicknames)
      ? body.nicknames.map((value) => String(value).trim()).filter(Boolean)
      : [];

    const gradesByNickname = await getGradesByNicknames(nicknames);
    return NextResponse.json({ gradesByNickname });
  } catch {
    return NextResponse.json(
      { error: "등급 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
