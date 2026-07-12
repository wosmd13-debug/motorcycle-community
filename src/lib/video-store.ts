import { promises as fs } from "fs";
import path from "path";
import {
  normalizeVideoPost,
  seedVideos,
  type CommentVoteChoice,
  type CreateVideoPostInput,
  type VideoComment,
  type VideoPost,
} from "@/lib/videos";
import { applyCommentVoteChoice, toggleLikeByUser } from "@/lib/engagement";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "videos.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(seedVideos, null, 2),
      "utf8"
    );
  }
}

export async function readVideos(): Promise<VideoPost[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const videos = JSON.parse(raw) as VideoPost[];
  const normalized = videos.map(normalizeVideoPost);

  const needsMigration = videos.some(
    (video) =>
      video.views == null ||
      video.comments == null ||
      video.tags == null ||
      video.comments.some(
        (comment) => comment.upvotes == null || comment.downvotes == null
      )
  );

  if (needsMigration) {
    await writeVideos(normalized);
  }

  return normalized;
}

async function writeVideos(videos: VideoPost[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(videos, null, 2), "utf8");
}

export async function createVideo(
  input: CreateVideoPostInput
): Promise<VideoPost> {
  const videos = await readVideos();
  const video: VideoPost = {
    id: crypto.randomUUID(),
    ...input,
    likes: 0,
    views: 0,
    comments: [],
    createdAt: new Date().toISOString(),
  };

  videos.unshift(video);
  await writeVideos(videos);
  return video;
}

export async function likeVideo(
  id: string,
  userId: string
): Promise<{ video: VideoPost; liked: boolean } | null> {
  const videos = await readVideos();
  const index = videos.findIndex((video) => video.id === id);
  if (index === -1) return null;

  const { item, liked } = toggleLikeByUser(videos[index], userId);
  videos[index] = item;
  await writeVideos(videos);
  return { video: videos[index], liked };
}

export async function viewVideo(id: string): Promise<VideoPost | null> {
  const videos = await readVideos();
  const index = videos.findIndex((video) => video.id === id);
  if (index === -1) return null;

  videos[index] = { ...videos[index], views: videos[index].views + 1 };
  await writeVideos(videos);
  return videos[index];
}

export async function addVideoComment(
  id: string,
  input: { author: string; content: string }
): Promise<VideoPost | null> {
  const videos = await readVideos();
  const index = videos.findIndex((video) => video.id === id);
  if (index === -1) return null;

  const comment: VideoComment = {
    id: crypto.randomUUID(),
    author: input.author,
    content: input.content,
    upvotes: 0,
    downvotes: 0,
    createdAt: new Date().toISOString(),
  };

  videos[index] = {
    ...videos[index],
    comments: [comment, ...videos[index].comments],
  };

  await writeVideos(videos);
  return videos[index];
}

export async function voteVideoComment(
  videoId: string,
  commentId: string,
  userId: string,
  choice: CommentVoteChoice
): Promise<{ video: VideoPost; myVote: CommentVoteChoice | null } | null> {
  const videos = await readVideos();
  const videoIndex = videos.findIndex((video) => video.id === videoId);
  if (videoIndex === -1) return null;

  const commentIndex = videos[videoIndex].comments.findIndex(
    (comment) => comment.id === commentId
  );
  if (commentIndex === -1) return null;

  const { comment, myVote } = applyCommentVoteChoice(
    videos[videoIndex].comments[commentIndex],
    userId,
    choice
  );
  videos[videoIndex].comments[commentIndex] = comment;

  await writeVideos(videos);
  return { video: videos[videoIndex], myVote };
}

export async function getVideo(id: string): Promise<VideoPost | null> {
  const videos = await readVideos();
  return videos.find((video) => video.id === id) ?? null;
}

export async function deleteVideo(id: string): Promise<boolean> {
  const videos = await readVideos();
  const next = videos.filter((video) => video.id !== id);
  if (next.length === videos.length) return false;

  await writeVideos(next);
  return true;
}

export type UpdateVideoInput = {
  title?: string;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  channelName?: string;
  description?: string;
  category?: VideoPost["category"];
  tags?: string[];
};

export async function updateVideo(
  id: string,
  input: UpdateVideoInput
): Promise<VideoPost | null> {
  const videos = await readVideos();
  const index = videos.findIndex((video) => video.id === id);
  if (index === -1) return null;

  videos[index] = {
    ...videos[index],
    ...input,
  };

  await writeVideos(videos);
  return videos[index];
}
