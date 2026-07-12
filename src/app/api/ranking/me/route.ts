import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { getMemberRankingByUserId } from "@/lib/ranking-server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // 운영자는 랭킹 집계에서 제외
    if (user.isOperator) {
      return NextResponse.json({ ranking: null, excluded: true });
    }

    const ranking = await getMemberRankingByUserId(user.id);
    if (!ranking) {
      return NextResponse.json(
        { error: "회원 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ranking });
  } catch {
    return NextResponse.json(
      { error: "내 랭킹을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
