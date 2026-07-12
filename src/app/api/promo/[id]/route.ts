import { NextRequest, NextResponse } from "next/server";
import {
  addPromoComment,
  deletePromoPost,
  getPromoPost,
  likePromoPost,
  updatePromoPost,
  viewPromoPost,
  votePromoComment,
} from "@/lib/promo-store";
import {
  getCurrentUserFromRequest,
  requireCurrentUserFromRequest,
} from "@/lib/auth-server";
import {
  canManagePromoPost,
  parsePromoBusinessFields,
  promoCategories,
  promoDisplayTypes,
  type PromoCategory,
  type PromoDisplayType,
} from "@/lib/promo";
import { parseYouTubeVideoId } from "@/lib/videos";
import { trackMissionLike } from "@/lib/mission-track";
import { toPublicEngagementItem } from "@/lib/engagement";
import {
  parseCommentVoteChoice,
  rateLimitAnonymousView,
  requireUserWithRateLimit,
} from "@/lib/request-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const postCategories = promoCategories.filter(
  (category): category is PromoCategory => category !== "전체"
);

async function requireManageablePromoPost(request: NextRequest, id: string) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const post = await getPromoPost(id);
  if (!post) {
    return NextResponse.json(
      { error: "홍보글을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (!canManagePromoPost(user, post)) {
    return NextResponse.json(
      { error: "이 홍보글을 관리할 권한이 없습니다." },
      { status: 403 }
    );
  }

  return { user, post };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const post = await getPromoPost(id);
    if (!post) {
      return NextResponse.json(
        { error: "홍보글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ post: toPublicEngagementItem(post) });
  } catch {
    return NextResponse.json(
      { error: "홍보글을 불러오지 못했습니다." },
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

      const result = await likePromoPost(id, user.id);
      if (!result) {
        return NextResponse.json(
          { error: "홍보글을 찾을 수 없습니다." },
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

      const post = await viewPromoPost(id);
      if (!post) {
        return NextResponse.json(
          { error: "홍보글을 찾을 수 없습니다." },
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

      const result = await votePromoComment(id, commentId, user.id, choice);
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
      const access = await requireManageablePromoPost(request, id);
      if (access instanceof NextResponse) return access;

      const title =
        body.title !== undefined ? String(body.title).trim() : undefined;
      const content =
        body.content !== undefined ? String(body.content).trim() : undefined;
      const category = body.category as PromoCategory | undefined;
      const displayType = body.displayType as PromoDisplayType | undefined;
      const linkUrl =
        body.linkUrl !== undefined ? String(body.linkUrl).trim() : undefined;
      const youtubeUrl =
        body.youtubeUrl !== undefined ? String(body.youtubeUrl).trim() : undefined;
      const imageUrls = Array.isArray(body.imageUrls)
        ? body.imageUrls.map((url: unknown) => String(url).trim()).filter(Boolean)
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

      if (displayType !== undefined && !promoDisplayTypes.includes(displayType)) {
        return NextResponse.json(
          { error: "올바른 게시 형식을 선택해 주세요." },
          { status: 400 }
        );
      }

      const nextDisplayType = displayType ?? access.post.displayType;
      const nextImageUrls = imageUrls ?? access.post.imageUrls;

      if (nextDisplayType === "배너" && nextImageUrls.length === 0) {
        return NextResponse.json(
          { error: "배너 홍보는 대표 이미지 1장 이상이 필요합니다." },
          { status: 400 }
        );
      }

      let youtubeVideoId: string | undefined;
      if (youtubeUrl !== undefined) {
        if (!youtubeUrl) {
          youtubeVideoId = undefined;
        } else {
          const parsed = parseYouTubeVideoId(youtubeUrl);
          if (!parsed) {
            return NextResponse.json(
              { error: "올바른 유튜브 URL을 입력해 주세요." },
              { status: 400 }
            );
          }
          youtubeVideoId = parsed;
        }
      }

      const post = await updatePromoPost(id, {
        title,
        content,
        category,
        displayType,
        ...parsePromoBusinessFields(body),
        linkUrl,
        youtubeUrl,
        youtubeVideoId,
        imageUrls,
      });

      if (!post) {
        return NextResponse.json(
          { error: "홍보글을 찾을 수 없습니다." },
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
    const user = await requireCurrentUserFromRequest(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const content = String(body.content ?? "").trim();

    if (!content) {
      return NextResponse.json(
        { error: "댓글 내용을 입력해 주세요." },
        { status: 400 }
      );
    }

    const post = await addPromoComment(id, { author: user.nickname, content });
    if (!post) {
      return NextResponse.json(
        { error: "홍보글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ post: toPublicEngagementItem(post) }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "댓글을 등록하지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const access = await requireManageablePromoPost(request, id);
    if (access instanceof NextResponse) return access;

    const deleted = await deletePromoPost(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "홍보글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "홍보글을 삭제하지 못했습니다." },
      { status: 500 }
    );
  }
}
