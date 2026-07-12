import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookie,
  requireCurrentUserFromRequest,
} from "@/lib/auth-server";
import { deleteUserBikeGarage } from "@/lib/bike-garage-store";
import { purgeUserContentOnWithdrawal } from "@/lib/user-content-sync";
import { deleteUserAccount } from "@/lib/user-store";

export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = await requireCurrentUserFromRequest(request);
    if (sessionUser instanceof NextResponse) return sessionUser;

    const body = await request.json();
    const password = String(body.password ?? "");

    const result = await deleteUserAccount(sessionUser.id, password);
    if (result.error || !result.nickname) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await Promise.all([
      purgeUserContentOnWithdrawal(sessionUser.id, result.nickname),
      deleteUserBikeGarage(sessionUser.id),
    ]);

    const response = NextResponse.json({
      ok: true,
      message: "회원 탈퇴가 완료되었습니다.",
    });
    clearSessionCookie(response);
    return response;
  } catch {
    return NextResponse.json(
      { error: "회원 탈퇴에 실패했습니다." },
      { status: 500 }
    );
  }
}
