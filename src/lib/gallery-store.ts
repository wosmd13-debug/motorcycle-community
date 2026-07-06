import { promises as fs } from "fs";
import path from "path";
import {
  normalizeGalleryPost,
  seedGalleryPosts,
  type CreateGalleryPostInput,
  type GalleryComment,
  type GalleryPost,
} from "@/lib/gallery";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "gallery.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(seedGalleryPosts, null, 2),
      "utf8"
    );
  }
}

export async function readGalleryPosts(): Promise<GalleryPost[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const posts = JSON.parse(raw) as GalleryPost[];
  const normalized = posts.map(normalizeGalleryPost);

  const needsMigration = posts.some(
    (post) =>
      post.views == null ||
      post.comments == null ||
      post.comments.some(
        (comment) => comment.upvotes == null || comment.downvotes == null
      )
  );

  if (needsMigration) {
    await writeGalleryPosts(normalized);
  }

  return normalized;
}

async function writeGalleryPosts(posts: GalleryPost[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2), "utf8");
}

export async function createGalleryPost(
  input: CreateGalleryPostInput
): Promise<GalleryPost> {
  const posts = await readGalleryPosts();
  const post: GalleryPost = {
    id: crypto.randomUUID(),
    ...input,
    likes: 0,
    views: 0,
    comments: [],
    createdAt: new Date().toISOString(),
  };

  posts.unshift(post);
  await writeGalleryPosts(posts);
  return post;
}

export async function likeGalleryPost(id: string): Promise<GalleryPost | null> {
  const posts = await readGalleryPosts();
  const index = posts.findIndex((post) => post.id === id);
  if (index === -1) return null;

  posts[index] = { ...posts[index], likes: posts[index].likes + 1 };
  await writeGalleryPosts(posts);
  return posts[index];
}

export async function viewGalleryPost(id: string): Promise<GalleryPost | null> {
  const posts = await readGalleryPosts();
  const index = posts.findIndex((post) => post.id === id);
  if (index === -1) return null;

  posts[index] = { ...posts[index], views: posts[index].views + 1 };
  await writeGalleryPosts(posts);
  return posts[index];
}

export async function addGalleryComment(
  id: string,
  input: { author: string; content: string }
): Promise<GalleryPost | null> {
  const posts = await readGalleryPosts();
  const index = posts.findIndex((post) => post.id === id);
  if (index === -1) return null;

  const comment: GalleryComment = {
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

  await writeGalleryPosts(posts);
  return posts[index];
}

export async function voteGalleryComment(
  postId: string,
  commentId: string,
  delta: { up: number; down: number }
): Promise<GalleryPost | null> {
  const posts = await readGalleryPosts();
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

  await writeGalleryPosts(posts);
  return posts[postIndex];
}

export async function getGalleryPost(id: string): Promise<GalleryPost | null> {
  const posts = await readGalleryPosts();
  return posts.find((post) => post.id === id) ?? null;
}
