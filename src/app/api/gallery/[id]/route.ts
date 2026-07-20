import { NextRequest, NextResponse } from "next/server";
import {
  addGalleryComment,
  deleteGalleryPost,
  getGalleryPost,
  likeGalleryPost,
  updateGalleryPost,
  viewGalleryPost,
  voteGalleryComment,
} from "@/lib/gallery-store";
import { getCurrentUserFromRequest } from "@/lib/auth-server";
import {
  canManageGalleryPost,
  galleryCategories,
  type GalleryCategory,
} from "@/lib/gallery";
import type { MemberGradeId } from "@/lib/ranking";
import { isPermissionError } from "@/lib/json-store-write";
import { trackMissionLike } from "@/lib/mission-track";
import { toPublicEngagementItem } from "@/lib/engagement";
import {
  parseCommentVoteChoice,
  rateLimitAnonymousView,
  requireUserWithRateLimit,
} from "@/lib/request-guards";

const postCategories = galleryCategories.filter(
  (category): category is GalleryCategory => category !== "전체"
);

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function requireManageableGalleryPost(request: NextRequest, id: string) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const post = await getGalleryPost(id);
  if (!post) {
    return NextResponse.json(
      { error: "게시물을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (!canManageGalleryPost(user, post)) {
    return NextResponse.json(
      { error: "이 게시물을 관리할 권한이 없습니다." },
      { status: 403 }
    );
  }

  return { user, post };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const post = await getGalleryPost(id);
    if (!post) {
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ post: toPublicEngagementItem(post) });
  } catch {
    return NextResponse.json(
      { error: "게시물을 불러오지 못했습니다." },
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

      const result = await likeGalleryPost(id, user.id);
      if (!result) {
        return NextResponse.json(
          { error: "게시물을 찾을 수 없습니다." },
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

      const post = await viewGalleryPost(id);
      if (!post) {
        return NextResponse.json(
          { error: "게시물을 찾을 수 없습니다." },
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

      const result = await voteGalleryComment(id, commentId, user.id, choice);
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
      const access = await requireManageableGalleryPost(request, id);
      if (access instanceof NextResponse) return access;

      const title =
        body.title !== undefined ? String(body.title).trim() : undefined;
      const location =
        body.location !== undefined ? String(body.location).trim() : undefined;
      const category = body.category as GalleryCategory | undefined;
      const imageUrl =
        body.imageUrl !== undefined ? String(body.imageUrl).trim() : undefined;
      const caption =
        body.caption !== undefined ? String(body.caption).trim() : undefined;

      if (title !== undefined && !title) {
        return NextResponse.json(
          { error: "제목을 입력해 주세요." },
          { status: 400 }
        );
      }

      if (location !== undefined && !location) {
        return NextResponse.json(
          { error: "위치를 입력해 주세요." },
          { status: 400 }
        );
      }

      if (imageUrl !== undefined && !imageUrl) {
        return NextResponse.json(
          { error: "사진 URL이 필요합니다." },
          { status: 400 }
        );
      }

      if (category !== undefined && !postCategories.includes(category)) {
        return NextResponse.json(
          { error: "올바른 카테고리를 선택해 주세요." },
          { status: 400 }
        );
      }

      const post = await updateGalleryPost(id, {
        title,
        location,
        category,
        imageUrl,
        caption: caption || undefined,
      });

      if (!post) {
        return NextResponse.json(
          { error: "게시물을 찾을 수 없습니다." },
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

    const post = await addGalleryComment(id, {
      author: user.nickname,
      authorId: user.id,
      authorGradeId,
      content,
    });
    if (!post) {
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ post: toPublicEngagementItem(post) }, { status: 201 });
  } catch (error) {
    console.error("gallery comment POST failed:", error);
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
    const access = await requireManageableGalleryPost(request, id);
    if (access instanceof NextResponse) return access;

    const deleted = await deleteGalleryPost(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "게시물을 삭제하지 못했습니다." },
      { status: 500 }
    );
  }
}
