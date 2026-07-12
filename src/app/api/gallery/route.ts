import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserFromRequest } from "@/lib/auth-server";
import { galleryCategories, type GalleryCategory } from "@/lib/gallery";
import { createGalleryPost, readGalleryPosts } from "@/lib/gallery-store";
import { toPublicEngagementItem } from "@/lib/engagement";
import { getMemberRankingByUserId } from "@/lib/ranking-server";

const postCategories = galleryCategories.filter(
  (category): category is GalleryCategory => category !== "전체"
);

export async function GET() {
  try {
    const posts = await readGalleryPosts();
    return NextResponse.json({
      posts: posts.map((post) => toPublicEngagementItem(post)),
    });
  } catch {
    return NextResponse.json(
      { error: "갤러리 목록을 불러오지 못했습니다." },
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
    const location = String(body.location ?? "").trim();
    const category = body.category as GalleryCategory;
    const imageUrl = String(body.imageUrl ?? "").trim();
    const caption = String(body.caption ?? "").trim();

    if (!title || !location || !imageUrl) {
      return NextResponse.json(
        { error: "제목, 위치, 사진은 필수입니다." },
        { status: 400 }
      );
    }

    if (!postCategories.includes(category)) {
      return NextResponse.json(
        { error: "올바른 카테고리를 선택해 주세요." },
        { status: 400 }
      );
    }

    const ranking = await getMemberRankingByUserId(user.id);
    const authorGradeId = user.isOperator ? "operator" : ranking?.grade.id;

    const post = await createGalleryPost({
      title,
      author: user.nickname,
      authorId: user.id,
      authorGradeId,
      location,
      category,
      imageUrl,
      caption: caption || undefined,
    });

    return NextResponse.json(
      { post: toPublicEngagementItem(post) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "게시물을 등록하지 못했습니다." },
      { status: 500 }
    );
  }
}
