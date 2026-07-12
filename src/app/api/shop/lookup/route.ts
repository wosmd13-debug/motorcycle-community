import { NextRequest, NextResponse } from "next/server";
import { getCosmeticLookByNicknameMap } from "@/lib/shop-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nicknames = Array.isArray(body.nicknames)
      ? body.nicknames.map((item: unknown) => String(item)).filter(Boolean)
      : [];

    if (nicknames.length === 0) {
      return NextResponse.json({ looksByNickname: {} });
    }

    const looksByNickname = await getCosmeticLookByNicknameMap(
      nicknames.slice(0, 100)
    );
    return NextResponse.json({ looksByNickname });
  } catch {
    return NextResponse.json(
      { error: "코스메틱 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
