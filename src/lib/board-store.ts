import { promises as fs } from "fs";
import path from "path";
import {
  normalizeBoardPost,
  seedBoardPosts,
  type BoardComment,
  type BoardPost,
  type CreateBoardPostInput,
} from "@/lib/board";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "board.json");

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
    await writeBoardPosts(normalized);
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
}

export async function getBoardPost(id: string): Promise<BoardPost | null> {
  const posts = await readBoardPosts();
  return posts.find((post) => post.id === id) ?? null;
}

export async function likeBoardPost(id: string): Promise<BoardPost | null> {
  const posts = await readBoardPosts();
  const index = posts.findIndex((post) => post.id === id);
  if (index === -1) return null;

  posts[index] = { ...posts[index], likes: posts[index].likes + 1 };
  await writeBoardPosts(posts);
  return posts[index];
}

export async function viewBoardPost(id: string): Promise<BoardPost | null> {
  const posts = await readBoardPosts();
  const index = posts.findIndex((post) => post.id === id);
  if (index === -1) return null;

  posts[index] = { ...posts[index], views: posts[index].views + 1 };
  await writeBoardPosts(posts);
  return posts[index];
}

export async function addBoardComment(
  id: string,
  input: { author: string; content: string }
): Promise<BoardPost | null> {
  const posts = await readBoardPosts();
  const index = posts.findIndex((post) => post.id === id);
  if (index === -1) return null;

  const comment: BoardComment = {
    id: crypto.randomUUID(),
    author: input.author,
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
}

export async function voteBoardComment(
  postId: string,
  commentId: string,
  delta: { up: number; down: number }
): Promise<BoardPost | null> {
  const posts = await readBoardPosts();
  const postIndex = posts.findIndex((post) => post.id === postId);
  if (postIndex === -1) return null;

  const commentIndex = posts[postIndex].comments.findIndex(
    (comment) => comment.id === commentId
  );
  if (commentIndex === -1) return null;

  const comment = posts[postIndex].comments[commentIndex];
  posts[postIndex].comments[commentIndex] = {
    ...comment,
    upvotes: Math.max(0, comment.upvotes + delta.up),
    downvotes: Math.max(0, comment.downvotes + delta.down),
  };

  await writeBoardPosts(posts);
  return posts[postIndex];
}
