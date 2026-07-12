import { NextRequest, NextResponse } from "next/server";
import {
  addVideoComment,
  deleteVideo,
  getVideo,
  likeVideo,
  updateVideo,
  viewVideo,
  voteVideoComment,
} from "@/lib/video-store";
import {
  getCurrentUserFromRequest,
  requireCurrentUserFromRequest,
} from "@/lib/auth-server";
import {
  canManageVideo,
  parseTagsInput,
  parseYouTubeVideoId,
  videoCategories,
  type VideoCategory,
  type VideoPost,
} from "@/lib/videos";
import { trackMissionLike } from "@/lib/mission-track";
import { toPublicEngagementItem } from "@/lib/engagement";
import {
  parseCommentVoteChoice,
  rateLimitAnonymousView,
  requireUserWithRateLimit,
} from "@/lib/request-guards";
import type { PublicUser } from "@/lib/users";

const postCategories = videoCategories.filter(
  (category): category is VideoCategory => category !== "전체"
);

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function requireManageableVideo(
  request: NextRequest,
  id: string
): Promise<{ user: PublicUser; video: VideoPost } | NextResponse> {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const video = await getVideo(id);
  if (!video) {
    return NextResponse.json(
      { error: "영상을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (!canManageVideo(user, video)) {
    return NextResponse.json(
      { error: "이 영상을 관리할 권한이 없습니다." },
      { status: 403 }
    );
  }

  return { user, video };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const video = await getVideo(id);
    if (!video) {
      return NextResponse.json(
        { error: "영상을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ video: toPublicEngagementItem(video) });
  } catch {
    return NextResponse.json(
      { error: "영상을 불러오지 못했습니다." },
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

      const result = await likeVideo(id, user.id);
      if (!result) {
        return NextResponse.json(
          { error: "영상을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      if (result.liked) await trackMissionLike(request);
      return NextResponse.json({
        video: toPublicEngagementItem(result.video),
        liked: result.liked,
      });
    }

    if (body.action === "view") {
      const limited = rateLimitAnonymousView(request);
      if (limited) return limited;

      const video = await viewVideo(id);
      if (!video) {
        return NextResponse.json(
          { error: "영상을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({ video: toPublicEngagementItem(video) });
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

      const result = await voteVideoComment(id, commentId, user.id, choice);
      if (!result) {
        return NextResponse.json(
          { error: "댓글을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        video: toPublicEngagementItem(result.video),
        myVote: result.myVote,
      });
    }

    if (body.action === "update") {
      const access = await requireManageableVideo(request, id);
      if (access instanceof NextResponse) return access;

      const title =
        body.title !== undefined ? String(body.title).trim() : undefined;
      const youtubeUrl =
        body.youtubeUrl !== undefined ? String(body.youtubeUrl).trim() : undefined;
      const channelName =
        body.channelName !== undefined ? String(body.channelName).trim() : undefined;
      const description =
        body.description !== undefined ? String(body.description).trim() : undefined;
      const category = body.category as VideoCategory | undefined;
      const tags = Array.isArray(body.tags)
        ? body.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean).slice(0, 8)
        : body.tags !== undefined
          ? parseTagsInput(String(body.tags))
          : undefined;

      if (title !== undefined && !title) {
        return NextResponse.json(
          { error: "제목을 입력해 주세요." },
          { status: 400 }
        );
      }

      if (channelName !== undefined && !channelName) {
        return NextResponse.json(
          { error: "채널명을 입력해 주세요." },
          { status: 400 }
        );
      }

      if (category !== undefined && !postCategories.includes(category)) {
        return NextResponse.json(
          { error: "올바른 카테고리를 선택해 주세요." },
          { status: 400 }
        );
      }

      let youtubeVideoId: string | undefined;
      if (youtubeUrl !== undefined) {
        if (!youtubeUrl) {
          return NextResponse.json(
            { error: "유튜브 URL을 입력해 주세요." },
            { status: 400 }
          );
        }

        const parsedId = parseYouTubeVideoId(youtubeUrl);
        if (!parsedId) {
          return NextResponse.json(
            { error: "올바른 유튜브 영상 URL을 입력해 주세요." },
            { status: 400 }
          );
        }
        youtubeVideoId = parsedId;
      }

      const video = await updateVideo(id, {
        title,
        youtubeUrl,
        youtubeVideoId,
        channelName,
        description,
        category,
        tags,
      });

      if (!video) {
        return NextResponse.json(
          { error: "영상을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      return NextResponse.json({ video: toPublicEngagementItem(video) });
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

    const video = await addVideoComment(id, { author: user.nickname, content });
    if (!video) {
      return NextResponse.json(
        { error: "영상을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ video: toPublicEngagementItem(video) }, { status: 201 });
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
    const access = await requireManageableVideo(request, id);
    if (access instanceof NextResponse) return access;

    const deleted = await deleteVideo(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "영상을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "영상을 삭제하지 못했습니다." },
      { status: 500 }
    );
  }
}
