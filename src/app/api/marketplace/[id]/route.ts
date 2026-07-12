import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUserFromRequest,
  requireCurrentUserFromRequest,
} from "@/lib/auth-server";
import {
  canManageMarketplaceItem,
  marketplaceCategories,
  marketplaceConditions,
  marketplaceDeliveries,
  marketplaceStatuses,
  type MarketplaceCategory,
  type MarketplaceStatus,
} from "@/lib/marketplace";
import { isDetailRegion, type DetailRegion } from "@/lib/regions";
import {
  addMarketplaceComment,
  bumpMarketplaceItem,
  deleteMarketplaceItem,
  getMarketplaceItem,
  likeMarketplaceItem,
  updateMarketplaceItem,
  updateMarketplaceItemStatus,
  viewMarketplaceItem,
  voteMarketplaceComment,
} from "@/lib/marketplace-store";
import { toPublicEngagementItem } from "@/lib/engagement";
import {
  parseCommentVoteChoice,
  rateLimitAnonymousView,
  requireUserWithRateLimit,
} from "@/lib/request-guards";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const postCategories = marketplaceCategories.filter(
  (category): category is MarketplaceCategory => category !== "전체"
);

async function requireManageableItem(request: NextRequest, id: string) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const item = await getMarketplaceItem(id);
  if (!item) {
    return NextResponse.json(
      { error: "매물을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (!canManageMarketplaceItem(user, item)) {
    return NextResponse.json(
      { error: "이 매물을 관리할 권한이 없습니다." },
      { status: 403 }
    );
  }

  return { user, item };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const item = await getMarketplaceItem(id);
    if (!item) {
      return NextResponse.json(
        { error: "매물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ item: toPublicEngagementItem(item) });
  } catch {
    return NextResponse.json(
      { error: "매물을 불러오지 못했습니다." },
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

      const result = await likeMarketplaceItem(id, user.id);
      if (!result) {
        return NextResponse.json(
          { error: "매물을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        item: toPublicEngagementItem(result.item),
        liked: result.liked,
      });
    }

    if (body.action === "view") {
      const limited = rateLimitAnonymousView(request);
      if (limited) return limited;

      const item = await viewMarketplaceItem(id);
      if (!item) {
        return NextResponse.json(
          { error: "매물을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({ item: toPublicEngagementItem(item) });
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

      const result = await voteMarketplaceComment(id, commentId, user.id, choice);
      if (!result) {
        return NextResponse.json(
          { error: "댓글을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        item: toPublicEngagementItem(result.item),
        myVote: result.myVote,
      });
    }

    if (body.action === "status") {
      const access = await requireManageableItem(request, id);
      if (access instanceof NextResponse) return access;

      const status = body.status as MarketplaceStatus | undefined;
      if (!status || !marketplaceStatuses.includes(status)) {
        return NextResponse.json(
          { error: "올바른 판매 상태를 선택해 주세요." },
          { status: 400 }
        );
      }

      const item = await updateMarketplaceItemStatus(id, status);
      if (!item) {
        return NextResponse.json(
          { error: "매물을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      return NextResponse.json({ item: toPublicEngagementItem(item) });
    }

    if (body.action === "bump") {
      const access = await requireManageableItem(request, id);
      if (access instanceof NextResponse) return access;

      const result = await bumpMarketplaceItem(id);
      if (!result) {
        return NextResponse.json(
          { error: "매물을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      if (result === "cooldown") {
        return NextResponse.json(
          { error: "끌어올리기는 24시간에 한 번만 가능합니다." },
          { status: 429 }
        );
      }

      return NextResponse.json({ item: toPublicEngagementItem(result) });
    }

    if (body.action === "update") {
      const access = await requireManageableItem(request, id);
      if (access instanceof NextResponse) return access;

      const title =
        body.title !== undefined ? String(body.title).trim() : undefined;
      const description =
        body.description !== undefined ? String(body.description).trim() : undefined;
      const category = body.category as MarketplaceCategory | undefined;
      const condition = body.condition as
        | (typeof marketplaceConditions)[number]
        | undefined;
      const status = body.status as
        | (typeof marketplaceStatuses)[number]
        | undefined;
      const delivery = body.delivery as
        | (typeof marketplaceDeliveries)[number]
        | undefined;
      const region =
        body.region !== undefined ? String(body.region).trim() : undefined;
      const location =
        body.location !== undefined ? String(body.location).trim() : undefined;
      const contactMethod =
        body.contactMethod !== undefined
          ? String(body.contactMethod).trim()
          : undefined;
      const price =
        body.price !== undefined ? Math.round(Number(body.price)) : undefined;
      const imageUrls = Array.isArray(body.imageUrls)
        ? body.imageUrls.map((url: unknown) => String(url).trim()).filter(Boolean)
        : undefined;

      if (title !== undefined && !title) {
        return NextResponse.json(
          { error: "제목을 입력해 주세요." },
          { status: 400 }
        );
      }

      if (description !== undefined && !description) {
        return NextResponse.json(
          { error: "설명을 입력해 주세요." },
          { status: 400 }
        );
      }

      if (location !== undefined && !location) {
        return NextResponse.json(
          { error: "거래 지역을 입력해 주세요." },
          { status: 400 }
        );
      }

      if (category !== undefined && !postCategories.includes(category)) {
        return NextResponse.json(
          { error: "올바른 카테고리를 선택해 주세요." },
          { status: 400 }
        );
      }

      if (
        condition !== undefined &&
        !marketplaceConditions.includes(condition)
      ) {
        return NextResponse.json(
          { error: "올바른 상품 상태를 선택해 주세요." },
          { status: 400 }
        );
      }

      if (status !== undefined && !marketplaceStatuses.includes(status)) {
        return NextResponse.json(
          { error: "올바른 판매 상태를 선택해 주세요." },
          { status: 400 }
        );
      }

      if (
        delivery !== undefined &&
        !marketplaceDeliveries.includes(delivery)
      ) {
        return NextResponse.json(
          { error: "올바른 거래 방식을 선택해 주세요." },
          { status: 400 }
        );
      }

      if (region !== undefined && !isDetailRegion(region)) {
        return NextResponse.json(
          { error: "올바른 지역을 선택해 주세요." },
          { status: 400 }
        );
      }

      if (price !== undefined && (!Number.isFinite(price) || price < 0)) {
        return NextResponse.json(
          { error: "가격을 올바르게 입력해 주세요." },
          { status: 400 }
        );
      }

      const item = await updateMarketplaceItem(id, {
        title,
        description,
        category,
        condition,
        status,
        delivery,
        region: region as DetailRegion | undefined,
        location,
        contactMethod: contactMethod || undefined,
        price,
        imageUrls,
      });

      if (!item) {
        return NextResponse.json(
          { error: "매물을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      return NextResponse.json({ item: toPublicEngagementItem(item) });
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

    const item = await addMarketplaceComment(id, {
      author: user.nickname,
      content,
    });
    if (!item) {
      return NextResponse.json(
        { error: "매물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ item: toPublicEngagementItem(item) }, { status: 201 });
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
    const access = await requireManageableItem(request, id);
    if (access instanceof NextResponse) return access;

    const deleted = await deleteMarketplaceItem(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "매물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "매물을 삭제하지 못했습니다." },
      { status: 500 }
    );
  }
}
