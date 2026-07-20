import { NextRequest, NextResponse } from "next/server";
import {
  addBoardComment,
  deleteBoardPost,
  getBoardPost,
  likeBoardPost,
  updateBoardPost,
  viewBoardPost,
  voteBoardComment,
} from "@/lib/board-store";
import { requireCurrentUserFromRequest } from "@/lib/auth-server";
import {
  boardCategories,
  canManageBoardPost,
  type BoardCategory,
  type BoardPost,
} from "@/lib/board";
import type { MemberGradeId } from "@/lib/ranking";
import { isPermissionError } from "@/lib/json-store-write";
import { trackMissionLike } from "@/lib/mission-track";
import { toPublicEngagementItem } from "@/lib/engagement";
import {
  parseCommentVoteChoice,
  rateLimitAnonymousView,
  requireUserWithRateLimit,
} from "@/lib/request-guards";
import { sanitizePublicUploadUrls } from "@/lib/upload-files";
import type { PublicUser } from "@/lib/users";

const postCategories = boardCategories.filter(
  (category): category is BoardCategory => category !== "전체"
);

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function requireManageableBoardPost(
  request: NextRequest,
  id: string
): Promise<{ user: PublicUser; post: BoardPost } | NextResponse> {
  const user = await requireCurrentUserFromRequest(request);
  if (user instanceof NextResponse) return user;

  const post = await getBoardPost(id);
  if (!post) {
    return NextResponse.json(
      { error: "게시글을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (!canManageBoardPost(user, post)) {
    return NextResponse.json(
      { error: "이 게시글을 관리할 권한이 없습니다." },
      { status: 403 }
    );
  }

  return { user, post };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const post = await getBoardPost(id);
    if (!post) {
      return NextResponse.json(
        { error: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ post: toPublicEngagementItem(post) });
  } catch {
    return NextResponse.json(
      { error: "게시글을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    if (body.action === "like") {
      const user = await requireUserWithRateLimit(request, "like");
      if (user instanceof NextResponse) return user;

      const result = await likeBoardPost(id, user.id);
      if (!result) {
        return NextResponse.json(
          { error: "게시글을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      if (result.liked) await trackMissionLike(request);
      return NextResponse.json({
        post: toPublicEngagementItem(result.post),
        liked: result.liked,
      });
    }

    if (body.action === "view") {
      const limited = rateLimitAnonymousView(request);
      if (limited) return limited;

      const post = await viewBoardPost(id);
      if (!post) {
        return NextResponse.json(
          { error: "게시글을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({ post: toPublicEngagementItem(post) });
    }

    if (body.action === "comment-vote") {
      const user = await requireUserWithRateLimit(request, "comment-vote");
      if (user instanceof NextResponse) return user;

      const commentId = String(body.commentId ?? "");
      const choice = parseCommentVoteChoice(body);
      if (!commentId || !choice) {
        return NextResponse.json(
          { error: "댓글 투표 정보가 올바르지 않습니다." },
          { status: 400 }
        );
      }

      const result = await voteBoardComment(id, commentId, user.id, choice);
      if (!result) {
        return NextResponse.json(
          { error: "댓글을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        post: toPublicEngagementItem(result.post),
        myVote: result.myVote,
      });
    }

    if (body.action === "update") {
      const access = await requireManageableBoardPost(request, id);
      if (access instanceof NextResponse) return access;

      const title =
        body.title !== undefined ? String(body.title).trim() : undefined;
      const content =
        body.content !== undefined ? String(body.content).trim() : undefined;
      const category = body.category as BoardCategory | undefined;
      const imageUrls = Array.isArray(body.imageUrls)
        ? sanitizePublicUploadUrls(
            body.imageUrls
              .map((url: unknown) => String(url).trim())
              .filter(Boolean)
          )
        : undefined;

      if (title !== undefined && !title) {
        return NextResponse.json(
          { error: "제목을 입력해 주세요." },
          { status: 400 }
        );
      }

      if (content !== undefined && !content) {
        return NextResponse.json(
          { error: "내용을 입력해 주세요." },
          { status: 400 }
        );
      }

      if (category !== undefined && !postCategories.includes(category)) {
        return NextResponse.json(
          { error: "올바른 분류를 선택해 주세요." },
          { status: 400 }
        );
      }

      const post = await updateBoardPost(id, {
        title,
        content,
        category,
        imageUrls,
      });

      if (!post) {
        return NextResponse.json(
          { error: "게시글을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      return NextResponse.json({ post: toPublicEngagementItem(post) });
    }

    return NextResponse.json({ error: "지원하지 않는 요청입니다." }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "요청을 처리하지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const user = await requireUserWithRateLimit(request, "comment");
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const content = String(body.content ?? "").trim();

    if (!content) {
      return NextResponse.json(
        { error: "댓글 내용을 입력해 주세요." },
        { status: 400 }
      );
    }

    const authorGradeId: MemberGradeId = user.isOperator ? "operator" : "beginner";

    const post = await addBoardComment(id, {
      author: user.nickname,
      authorId: user.id,
      authorGradeId,
      content,
    });
    if (!post) {
      return NextResponse.json(
        { error: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ post: toPublicEngagementItem(post) }, { status: 201 });
  } catch (error) {
    console.error("board comment POST failed:", error);
    if (isPermissionError(error)) {
      return NextResponse.json(
        {
          error:
            "댓글 저장 권한 오류입니다. 잠시 후 다시 시도하거나 운영자에게 문의해 주세요.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "댓글을 등록하지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const access = await requireManageableBoardPost(request, id);
    if (access instanceof NextResponse) return access;

    const deleted = await deleteBoardPost(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "게시글을 삭제하지 못했습니다." },
      { status: 500 }
    );
  }
}
