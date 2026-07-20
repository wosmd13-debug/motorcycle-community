import { promises as fs } from "fs";
import path from "path";
import {
  normalizeBoardPost,
  seedBoardPosts,
  type BoardComment,
  type BoardPost,
  type CommentVoteChoice,
  type CreateBoardPostInput,
} from "@/lib/board";
import { applyCommentVoteChoice, toggleLikeByUser } from "@/lib/engagement";
import { withJsonStoreLock } from "@/lib/json-store-lock";
import {
  isPermissionError,
  writeJsonFileAtomic,
} from "@/lib/json-store-write";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "board.json");
const STORE_LOCK_KEY = "board";

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(seedBoardPosts, null, 2),
      "utf8"
    );
  }
}

function needsBoardMigration(posts: BoardPost[]): boolean {
  return posts.some(
    (post) =>
      post.imageUrls == null ||
      post.views == null ||
      post.likes == null ||
      post.comments == null ||
      (post.comments ?? []).some(
        (comment) => comment.upvotes == null || comment.downvotes == null
      )
  );
}

async function loadRawBoardPostsFromDisk(): Promise<BoardPost[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as BoardPost[];
}

async function loadBoardPostsFromDisk(): Promise<BoardPost[]> {
  const posts = await loadRawBoardPostsFromDisk();
  return posts.map(normalizeBoardPost);
}

export async function readBoardPosts(): Promise<BoardPost[]> {
  const rawPosts = await loadRawBoardPostsFromDisk();
  const normalized = rawPosts.map(normalizeBoardPost);

  if (needsBoardMigration(rawPosts)) {
    await withJsonStoreLock(STORE_LOCK_KEY, async () => {
      await writeBoardPosts(normalized);
    });
  }

  return normalized;
}

async function mutateBoardPosts<T>(
  mutate: (posts: BoardPost[]) => Promise<T> | T
): Promise<T> {
  return withJsonStoreLock(STORE_LOCK_KEY, async () => {
    const posts = await loadBoardPostsFromDisk();
    return mutate(posts);
  });
}

async function writeBoardPosts(posts: BoardPost[]) {
  await writeJsonFileAtomic(DATA_FILE, posts);
}

export async function createBoardPost(
  input: CreateBoardPostInput
): Promise<BoardPost> {
  return mutateBoardPosts(async (posts) => {
    const post: BoardPost = {
      id: crypto.randomUUID(),
      ...input,
      imageUrls: input.imageUrls ?? [],
      likes: 0,
      views: 0,
      comments: [],
      createdAt: new Date().toISOString(),
    };

    posts.unshift(post);
    await writeBoardPosts(posts);
    return post;
  });
}

export async function getBoardPost(id: string): Promise<BoardPost | null> {
  const posts = await readBoardPosts();
  return posts.find((post) => post.id === id) ?? null;
}

export async function likeBoardPost(
  id: string,
  userId: string
): Promise<{ post: BoardPost; liked: boolean } | null> {
  return mutateBoardPosts(async (posts) => {
    const index = posts.findIndex((post) => post.id === id);
    if (index === -1) return null;

    const { item, liked } = toggleLikeByUser(posts[index], userId);
    posts[index] = item;
    await writeBoardPosts(posts);
    return { post: posts[index], liked };
  });
}

export async function viewBoardPost(id: string): Promise<BoardPost | null> {
  return mutateBoardPosts(async (posts) => {
    const index = posts.findIndex((post) => post.id === id);
    if (index === -1) return null;

    posts[index] = { ...posts[index], views: posts[index].views + 1 };
    await writeBoardPosts(posts);
    return posts[index];
  });
}

export async function addBoardComment(
  id: string,
  input: { author: string; authorId?: string; authorGradeId?: import("@/lib/ranking").MemberGradeId; content: string }
): Promise<BoardPost | null> {
  return mutateBoardPosts(async (posts) => {
    const index = posts.findIndex((post) => post.id === id);
    if (index === -1) return null;

    const comment: BoardComment = {
      id: crypto.randomUUID(),
      author: input.author,
      authorId: input.authorId,
      authorGradeId: input.authorGradeId,
      content: input.content,
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date().toISOString(),
    };

    posts[index] = {
      ...posts[index],
      comments: [comment, ...posts[index].comments],
    };

    await writeBoardPosts(posts);
    return posts[index];
  });
}

export async function voteBoardComment(
  postId: string,
  commentId: string,
  userId: string,
  choice: CommentVoteChoice
): Promise<{ post: BoardPost; myVote: CommentVoteChoice | null } | null> {
  return mutateBoardPosts(async (posts) => {
    const postIndex = posts.findIndex((post) => post.id === postId);
    if (postIndex === -1) return null;

    const commentIndex = posts[postIndex].comments.findIndex(
      (comment) => comment.id === commentId
    );
    if (commentIndex === -1) return null;

    const { comment, myVote } = applyCommentVoteChoice(
      posts[postIndex].comments[commentIndex],
      userId,
      choice
    );
    posts[postIndex].comments[commentIndex] = comment;

    await writeBoardPosts(posts);
    return { post: posts[postIndex], myVote };
  });
}

export async function deleteBoardPost(id: string): Promise<boolean> {
  return mutateBoardPosts(async (posts) => {
    const target = posts.find((post) => post.id === id);
    if (!target) return false;

    const { deleteUploadedPublicUrls } = await import("@/lib/upload-files");
    await deleteUploadedPublicUrls(target.imageUrls ?? []);

    const next = posts.filter((post) => post.id !== id);
    await writeBoardPosts(next);
    return true;
  });
}

export type UpdateBoardPostInput = {
  title?: string;
  content?: string;
  category?: BoardPost["category"];
  imageUrls?: string[];
};

export async function updateBoardPost(
  id: string,
  input: UpdateBoardPostInput
): Promise<BoardPost | null> {
  return mutateBoardPosts(async (posts) => {
    const index = posts.findIndex((post) => post.id === id);
    if (index === -1) return null;

    const previous = posts[index];
    if (input.imageUrls) {
      const removed = (previous.imageUrls ?? []).filter(
        (url) => !input.imageUrls!.includes(url)
      );
      const { deleteUploadedPublicUrls } = await import("@/lib/upload-files");
      await deleteUploadedPublicUrls(removed);
    }

    posts[index] = {
      ...posts[index],
      ...input,
    };

    await writeBoardPosts(posts);
    return posts[index];
  });
}
