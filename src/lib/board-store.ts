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

export async function readBoardPosts(): Promise<BoardPost[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const posts = JSON.parse(raw) as BoardPost[];
  const normalized = posts.map(normalizeBoardPost);

  const needsMigration = posts.some(
    (post) =>
      post.imageUrls == null ||
      post.views == null ||
      post.likes == null ||
      post.comments == null ||
      post.comments.some(
        (comment) => comment.upvotes == null || comment.downvotes == null
      )
  );

  if (needsMigration) {
    await withJsonStoreLock(STORE_LOCK_KEY, async () => {
      await writeBoardPosts(normalized);
    });
  }

  return normalized;
}

async function writeBoardPosts(posts: BoardPost[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2), "utf8");
}

export async function createBoardPost(
  input: CreateBoardPostInput
): Promise<BoardPost> {
  return withJsonStoreLock(STORE_LOCK_KEY, async () => {
    const posts = await readBoardPosts();
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
  return withJsonStoreLock(STORE_LOCK_KEY, async () => {
    const posts = await readBoardPosts();
    const index = posts.findIndex((post) => post.id === id);
    if (index === -1) return null;

    const { item, liked } = toggleLikeByUser(posts[index], userId);
    posts[index] = item;
    await writeBoardPosts(posts);
    return { post: posts[index], liked };
  });
}

export async function viewBoardPost(id: string): Promise<BoardPost | null> {
  return withJsonStoreLock(STORE_LOCK_KEY, async () => {
    const posts = await readBoardPosts();
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
  return withJsonStoreLock(STORE_LOCK_KEY, async () => {
    const posts = await readBoardPosts();
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
  return withJsonStoreLock(STORE_LOCK_KEY, async () => {
    const posts = await readBoardPosts();
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
  return withJsonStoreLock(STORE_LOCK_KEY, async () => {
    const posts = await readBoardPosts();
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
  return withJsonStoreLock(STORE_LOCK_KEY, async () => {
    const posts = await readBoardPosts();
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
