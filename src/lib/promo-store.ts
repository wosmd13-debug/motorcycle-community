import { promises as fs } from "fs";
import path from "path";
import {
  normalizePromoPost,
  seedPromoPosts,
  type CommentVoteChoice,
  type CreatePromoPostInput,
  type PromoComment,
  type PromoPost,
} from "@/lib/promo";
import { applyCommentVoteChoice, toggleLikeByUser } from "@/lib/engagement";
import { deleteUploadedPublicUrls } from "@/lib/upload-files";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "promo.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(seedPromoPosts, null, 2),
      "utf8"
    );
  }
}

export async function readPromoPosts(): Promise<PromoPost[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const posts = JSON.parse(raw) as PromoPost[];
  const normalized = posts.map(normalizePromoPost);

  const needsMigration = posts.some(
    (post) =>
      post.displayType == null ||
      post.imageUrls == null ||
      post.views == null ||
      post.likes == null ||
      post.comments == null ||
      post.comments.some(
        (comment) => comment.upvotes == null || comment.downvotes == null
      )
  );

  if (needsMigration) {
    await writePromoPosts(normalized);
  }

  return normalized;
}

async function writePromoPosts(posts: PromoPost[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2), "utf8");
}

export async function createPromoPost(
  input: CreatePromoPostInput
): Promise<PromoPost> {
  const posts = await readPromoPosts();
  const post: PromoPost = {
    id: crypto.randomUUID(),
    ...input,
    displayType: input.displayType ?? "일반",
    imageUrls: input.imageUrls ?? [],
    likes: 0,
    views: 0,
    comments: [],
    createdAt: new Date().toISOString(),
  };

  posts.unshift(post);
  await writePromoPosts(posts);
  return post;
}

export async function getPromoPost(id: string): Promise<PromoPost | null> {
  const posts = await readPromoPosts();
  return posts.find((post) => post.id === id) ?? null;
}

export async function likePromoPost(
  id: string,
  userId: string
): Promise<{ post: PromoPost; liked: boolean } | null> {
  const posts = await readPromoPosts();
  const index = posts.findIndex((post) => post.id === id);
  if (index === -1) return null;

  const { item, liked } = toggleLikeByUser(posts[index], userId);
  posts[index] = item;
  await writePromoPosts(posts);
  return { post: posts[index], liked };
}

export async function viewPromoPost(id: string): Promise<PromoPost | null> {
  const posts = await readPromoPosts();
  const index = posts.findIndex((post) => post.id === id);
  if (index === -1) return null;

  posts[index] = { ...posts[index], views: posts[index].views + 1 };
  await writePromoPosts(posts);
  return posts[index];
}

export async function addPromoComment(
  id: string,
  input: { author: string; content: string }
): Promise<PromoPost | null> {
  const posts = await readPromoPosts();
  const index = posts.findIndex((post) => post.id === id);
  if (index === -1) return null;

  const comment: PromoComment = {
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

  await writePromoPosts(posts);
  return posts[index];
}

export async function votePromoComment(
  postId: string,
  commentId: string,
  userId: string,
  choice: CommentVoteChoice
): Promise<{ post: PromoPost; myVote: CommentVoteChoice | null } | null> {
  const posts = await readPromoPosts();
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

  await writePromoPosts(posts);
  return { post: posts[postIndex], myVote };
}

export async function updatePromoPost(
  id: string,
  input: {
    title?: string;
    content?: string;
    category?: PromoPost["category"];
    displayType?: PromoPost["displayType"];
    address?: string;
    phone?: string;
    businessHours?: string;
    businessWeeklyHours?: PromoPost["businessWeeklyHours"];
    businessStatus?: string;
    linkUrl?: string;
    youtubeUrl?: string;
    youtubeVideoId?: string;
    imageUrls?: string[];
  }
): Promise<PromoPost | null> {
  const posts = await readPromoPosts();
  const index = posts.findIndex((post) => post.id === id);
  if (index === -1) return null;

  const current = posts[index];
  if (input.imageUrls) {
    const removed = (current.imageUrls ?? []).filter(
      (url) => !input.imageUrls!.includes(url)
    );
    await deleteUploadedPublicUrls(removed);
  }

  posts[index] = normalizePromoPost({
    ...current,
    ...input,
    address: input.address !== undefined ? input.address || undefined : current.address,
    phone: input.phone !== undefined ? input.phone || undefined : current.phone,
    businessHours:
      input.businessHours !== undefined
        ? input.businessHours || undefined
        : current.businessHours,
    businessWeeklyHours:
      input.businessWeeklyHours !== undefined
        ? input.businessWeeklyHours || undefined
        : current.businessWeeklyHours,
    businessStatus:
      input.businessStatus !== undefined
        ? input.businessStatus || undefined
        : current.businessStatus,
    linkUrl: input.linkUrl !== undefined ? input.linkUrl || undefined : current.linkUrl,
    youtubeUrl:
      input.youtubeUrl !== undefined ? input.youtubeUrl || undefined : current.youtubeUrl,
    youtubeVideoId:
      input.youtubeVideoId !== undefined
        ? input.youtubeVideoId || undefined
        : current.youtubeVideoId,
    imageUrls: input.imageUrls ?? current.imageUrls,
  });

  await writePromoPosts(posts);
  return posts[index];
}

export async function deletePromoPost(id: string): Promise<boolean> {
  const posts = await readPromoPosts();
  const target = posts.find((post) => post.id === id);
  if (!target) return false;

  await deleteUploadedPublicUrls(target.imageUrls ?? []);

  const next = posts.filter((post) => post.id !== id);
  await writePromoPosts(next);
  return true;
}
