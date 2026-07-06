import { NextRequest, NextResponse } from "next/server";
import {
  addGalleryComment,
  getGalleryPost,
  likeGalleryPost,
  viewGalleryPost,
  voteGalleryComment,
} from "@/lib/gallery-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

    return NextResponse.json({ post });
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
      const post = await likeGalleryPost(id);
      if (!post) {
        return NextResponse.json(
          { error: "게시물을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({ post });
    }

    if (body.action === "view") {
      const post = await viewGalleryPost(id);
      if (!post) {
        return NextResponse.json(
          { error: "게시물을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({ post });
    }

    if (body.action === "comment-vote") {
      const commentId = String(body.commentId ?? "");
      const up = Number(body.up ?? 0);
      const down = Number(body.down ?? 0);

      if (!commentId || (up === 0 && down === 0)) {
        return NextResponse.json(
          { error: "댓글 투표 정보가 올바르지 않습니다." },
          { status: 400 }
        );
      }

      const post = await voteGalleryComment(id, commentId, { up, down });
      if (!post) {
        return NextResponse.json(
          { error: "댓글을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({ post });
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
    const body = await request.json();
    const author = String(body.author ?? "").trim();
    const content = String(body.content ?? "").trim();

    if (!author || !content) {
      return NextResponse.json(
        { error: "작성자와 댓글 내용을 입력해 주세요." },
        { status: 400 }
      );
    }

    const post = await addGalleryComment(id, { author, content });
    if (!post) {
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "댓글을 등록하지 못했습니다." },
      { status: 500 }
    );
  }
}
