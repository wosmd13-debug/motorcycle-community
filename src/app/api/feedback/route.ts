import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUserFromRequest,
  requireOperatorFromRequest,
} from "@/lib/auth-server";
import {
  createFeedback,
  readFeedback,
  updateFeedbackStatus,
} from "@/lib/feedback-store";
import {
  feedbackCategories,
  type FeedbackCategory,
} from "@/lib/feedback";
import { isOperatorUser } from "@/lib/admin";
import {
  checkRateLimit,
  clientKeyFromRequest,
} from "@/lib/rate-limit";

const FEEDBACK_LIMIT_USER = 10;
const FEEDBACK_LIMIT_GUEST = 5;
const FEEDBACK_WINDOW_MS = 60 * 60 * 1000;

function rateLimitFeedback(
  request: NextRequest,
  userId?: string
): NextResponse | null {
  const result = checkRateLimit(
    clientKeyFromRequest(
      request,
      userId ? "feedback" : "feedback-guest",
      userId
    ),
    userId ? FEEDBACK_LIMIT_USER : FEEDBACK_LIMIT_GUEST,
    FEEDBACK_WINDOW_MS
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        error: `요청이 너무 많습니다. ${result.retryAfterSec}초 후 다시 시도해 주세요.`,
      },
      { status: 429 }
    );
  }

  return null;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET(request: NextRequest) {
  const operator = await requireOperatorFromRequest(request);
  if (operator instanceof NextResponse) return operator;

  const status = request.nextUrl.searchParams.get("status");
  const entries = await readFeedback();

  const filtered =
    status === "pending" || status === "resolved" || status === "dismissed"
      ? entries.filter((entry) => entry.status === status)
      : entries;

  return NextResponse.json({ feedback: filtered });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (user && isOperatorUser(user)) {
    return NextResponse.json(
      { error: "운영자 계정은 건의·문의 관리 페이지를 이용해 주세요." },
      { status: 403 }
    );
  }

  const limited = rateLimitFeedback(request, user?.id);
  if (limited) return limited;

  try {
    const body = await request.json();
    const category = String(body.category ?? "") as FeedbackCategory;
    const title = String(body.title ?? "").trim();
    const message = String(body.message ?? "").trim();
    const contactEmail = String(body.contactEmail ?? "").trim();
    const pageUrl = String(body.pageUrl ?? "").trim();
    const nickname = String(body.nickname ?? "").trim();

    if (!feedbackCategories.includes(category)) {
      return NextResponse.json(
        { error: "유효하지 않은 문의 유형입니다." },
        { status: 400 }
      );
    }

    if (title.length < 2 || title.length > 100) {
      return NextResponse.json(
        { error: "제목은 2~100자로 입력해 주세요." },
        { status: 400 }
      );
    }

    if (message.length < 5 || message.length > 2000) {
      return NextResponse.json(
        { error: "내용은 5~2,000자로 입력해 주세요." },
        { status: 400 }
      );
    }

    const resolvedEmail = contactEmail;

    if (!resolvedEmail || !isValidEmail(resolvedEmail)) {
      return NextResponse.json(
        { error: "회신받을 이메일 주소를 올바르게 입력해 주세요." },
        { status: 400 }
      );
    }

    const resolvedNickname = user ? user.nickname : nickname.trim();

    if (!user && resolvedNickname.length < 1) {
      return NextResponse.json(
        { error: "이름 또는 닉네임을 입력해 주세요." },
        { status: 400 }
      );
    }

    const feedback = await createFeedback({
      category,
      title,
      message,
      contactEmail: resolvedEmail,
      pageUrl: pageUrl || undefined,
      userId: user?.id,
      nickname: resolvedNickname,
    });

    return NextResponse.json({ feedback }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "건의·문의 접수에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const operator = await requireOperatorFromRequest(request);
  if (operator instanceof NextResponse) return operator;

  try {
    const body = await request.json();
    const id = String(body.id ?? "").trim();
    const action = String(body.action ?? "");
    const adminNote = String(body.adminNote ?? "").trim();

    if (!id) {
      return NextResponse.json(
        { error: "건의 ID가 필요합니다." },
        { status: 400 }
      );
    }

    if (action === "dismiss") {
      const feedback = await updateFeedbackStatus(id, "dismissed", adminNote);
      if (!feedback) {
        return NextResponse.json(
          { error: "건의를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({ feedback });
    }

    if (action === "resolve") {
      const feedback = await updateFeedbackStatus(id, "resolved", adminNote);
      if (!feedback) {
        return NextResponse.json(
          { error: "건의를 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({ feedback });
    }

    return NextResponse.json(
      { error: "유효하지 않은 처리 요청입니다." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "건의 처리에 실패했습니다." },
      { status: 500 }
    );
  }
}
