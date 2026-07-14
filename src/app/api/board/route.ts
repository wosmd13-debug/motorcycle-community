import { NextRequest, NextResponse } from "next/server";
import { boardCategories, type BoardCategory } from "@/lib/board";
import { createBoardPost, readBoardPosts } from "@/lib/board-store";
import { toPublicEngagementItem } from "@/lib/engagement";
import { getMemberRankingByUserId } from "@/lib/ranking-server";
import { requireUserWithRateLimit } from "@/lib/request-guards";

const postCategories = boardCategories.filter(
  (category): category is BoardCategory => category !== "전체"
);

export async function GET() {
  try {
    const posts = await readBoardPosts();
    return NextResponse.json({
      posts: posts.map((post) => toPublicEngagementItem(post)),
    });
  } catch {
    return NextResponse.json(
      { error: "자유게시판 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUserWithRateLimit(request, "write");
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();
    const category = body.category as BoardCategory;
    const imageUrls = Array.isArray(body.imageUrls)
      ? body.imageUrls.map((url: unknown) => String(url).trim()).filter(Boolean)
      : [];

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

    const ranking = await getMemberRankingByUserId(user.id);
    const authorGradeId = user.isOperator ? "operator" : ranking?.grade.id;

    const post = await createBoardPost({
      title,
      author: user.nickname,
      authorId: user.id,
      authorGradeId,
      content,
      category,
      imageUrls,
    });

    return NextResponse.json(
      { post: toPublicEngagementItem(post) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "게시글을 등록하지 못했습니다." },
      { status: 500 }
    );
  }
}
