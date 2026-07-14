import { NextRequest, NextResponse } from "next/server";
import { toPublicEngagementItem } from "@/lib/engagement";
import { requireUserWithRateLimit } from "@/lib/request-guards";
import {
  parseTagsInput,
  parseYouTubeVideoId,
  videoCategories,
  type VideoCategory,
} from "@/lib/videos";
import { createVideo, readVideos } from "@/lib/video-store";

const postCategories = videoCategories.filter(
  (category): category is VideoCategory => category !== "전체"
);

export async function GET() {
  try {
    const videos = await readVideos();
    return NextResponse.json({
      videos: videos.map((video) => toPublicEngagementItem(video)),
    });
  } catch {
    return NextResponse.json(
      { error: "영상 목록을 불러오지 못했습니다." },
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
    const youtubeUrl = String(body.youtubeUrl ?? "").trim();
    const channelName = String(body.channelName ?? "").trim();
    const description = String(body.description ?? "").trim();
    const category = body.category as VideoCategory;
    const tags = Array.isArray(body.tags)
      ? body.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean).slice(0, 8)
      : parseTagsInput(String(body.tags ?? ""));

    const youtubeVideoId = parseYouTubeVideoId(youtubeUrl);

    if (!title || !youtubeUrl || !channelName) {
      return NextResponse.json(
        { error: "제목, 유튜브 URL, 채널명은 필수입니다." },
        { status: 400 }
      );
    }

    if (!youtubeVideoId) {
      return NextResponse.json(
        { error: "올바른 유튜브 영상 URL을 입력해 주세요." },
        { status: 400 }
      );
    }

    if (!postCategories.includes(category)) {
      return NextResponse.json(
        { error: "올바른 카테고리를 선택해 주세요." },
        { status: 400 }
      );
    }

    const video = await createVideo({
      title,
      youtubeUrl,
      youtubeVideoId,
      channelName,
      submitter: user.nickname,
      authorId: user.id,
      description,
      category,
      tags,
    });

    return NextResponse.json(
      { video: toPublicEngagementItem(video) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "영상을 등록하지 못했습니다." },
      { status: 500 }
    );
  }
}
