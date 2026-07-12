import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUserFromRequest,
  requireCurrentUserFromRequest,
  setSessionCookie,
} from "@/lib/auth-server";
import { withAdminFlag } from "@/lib/admin";
import { syncUserNicknameInContent } from "@/lib/user-content-sync";
import { findUserById, updateUserProfile } from "@/lib/user-store";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getCurrentUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const user = await findUserById(sessionUser.id);
    if (!user) {
      return NextResponse.json(
        { error: "회원 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: withAdminFlag({
        id: user.id,
        loginId: user.loginId,
        nickname: user.nickname,
      }),
      createdAt: user.createdAt,
    });
  } catch {
    return NextResponse.json(
      { error: "회원 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await requireCurrentUserFromRequest(request);
    if (sessionUser instanceof NextResponse) return sessionUser;

    const body = await request.json();
    const nickname =
      body.nickname !== undefined ? String(body.nickname).trim() : undefined;
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword =
      body.newPassword !== undefined && body.newPassword !== ""
        ? String(body.newPassword)
        : undefined;

    const result = await updateUserProfile(sessionUser.id, {
      nickname,
      currentPassword,
      newPassword,
    });

    if (result.error || !result.user) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (result.oldNickname) {
      await syncUserNicknameInContent(
        sessionUser.id,
        result.oldNickname,
        result.user.nickname
      );
    }

    const publicUser = withAdminFlag(result.user);
    const response = NextResponse.json({
      user: publicUser,
      message: "회원 정보가 수정되었습니다.",
    });
    setSessionCookie(response, publicUser);
    return response;
  } catch {
    return NextResponse.json(
      { error: "회원 정보 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}
