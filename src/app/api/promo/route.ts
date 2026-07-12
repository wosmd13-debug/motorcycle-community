import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserFromRequest } from "@/lib/auth-server";
import { toPublicEngagementItem } from "@/lib/engagement";
import { parseYouTubeVideoId } from "@/lib/videos";
import { promoCategories, promoDisplayTypes, parsePromoBusinessFields, type PromoCategory, type PromoDisplayType } from "@/lib/promo";
import { createPromoPost, readPromoPosts } from "@/lib/promo-store";

const postCategories = promoCategories.filter(
  (category): category is PromoCategory => category !== "전체"
);

export async function GET() {
  try {
    const posts = await readPromoPosts();
    return NextResponse.json({
      posts: posts.map((post) => toPublicEngagementItem(post)),
    });
  } catch {
    return NextResponse.json(
      { error: "자유홍보 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUserFromRequest(request);
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();
    const category = body.category as PromoCategory;
    const displayType = (body.displayType as PromoDisplayType | undefined) ?? "일반";
    const linkUrl = String(body.linkUrl ?? "").trim();
    const youtubeUrl = String(body.youtubeUrl ?? "").trim();
    const agreedToRules = Boolean(body.agreedToRules);
    const imageUrls = Array.isArray(body.imageUrls)
      ? body.imageUrls.map((url: unknown) => String(url).trim()).filter(Boolean)
      : [];

    if (!agreedToRules) {
      return NextResponse.json(
        { error: "홍보 규정 동의가 필요합니다." },
        { status: 400 }
      );
    }

    if (!title || !content) {
      return NextResponse.json(
        { error: "제목과 내용은 필수입니다." },
        { status: 400 }
      );
    }

    if (!postCategories.includes(category)) {
      return NextResponse.json(
        { error: "올바른 분류를 선택해 주세요." },
        { status: 400 }
      );
    }

    if (!promoDisplayTypes.includes(displayType)) {
      return NextResponse.json(
        { error: "올바른 게시 형식을 선택해 주세요." },
        { status: 400 }
      );
    }

    if (displayType === "배너" && imageUrls.length === 0) {
      return NextResponse.json(
        { error: "배너 홍보는 대표 이미지 1장 이상이 필요합니다." },
        { status: 400 }
      );
    }

    const youtubeVideoId = youtubeUrl ? parseYouTubeVideoId(youtubeUrl) : null;
    if (youtubeUrl && !youtubeVideoId) {
      return NextResponse.json(
        { error: "올바른 유튜브 URL을 입력해 주세요." },
        { status: 400 }
      );
    }

    const post = await createPromoPost({
      title,
      author: user.nickname,
      authorId: user.id,
      content,
      category,
      displayType,
      ...parsePromoBusinessFields(body),
      linkUrl: linkUrl || undefined,
      youtubeUrl: youtubeUrl || undefined,
      youtubeVideoId: youtubeVideoId ?? undefined,
      imageUrls,
    });

    return NextResponse.json(
      { post: toPublicEngagementItem(post) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "홍보글을 등록하지 못했습니다." },
      { status: 500 }
    );
  }
}
