import { promises as fs } from "fs";
import path from "path";
import {
  normalizeGalleryPost,
  seedGalleryPosts,
  type CommentVoteChoice,
  type CreateGalleryPostInput,
  type GalleryComment,
  type GalleryPost,
} from "@/lib/gallery";
import { applyCommentVoteChoice, toggleLikeByUser } from "@/lib/engagement";
import { withJsonStoreLock } from "@/lib/json-store-lock";
import { deleteUploadedPublicUrls } from "@/lib/upload-files";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "gallery.json");
const STORE_LOCK_KEY = "gallery";

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
    await withJsonStoreLock(STORE_LOCK_KEY, async () => {
      await writeGalleryPosts(normalized);
    });
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
  return withJsonStoreLock(STORE_LOCK_KEY, async () => {
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
  });
}

export async function likeGalleryPost(
  id: string,
  userId: string
): Promise<{ post: GalleryPost; liked: boolean } | null> {
  return withJsonStoreLock(STORE_LOCK_KEY, async () => {
    const posts = await readGalleryPosts();
    const index = posts.findIndex((post) => post.id === id);
    if (index === -1) return null;

    const { item, liked } = toggleLikeByUser(posts[index], userId);
    posts[index] = item;
    await writeGalleryPosts(posts);
    return { post: posts[index], liked };
  });
}

export async function viewGalleryPost(id: string): Promise<GalleryPost | null> {
  return withJsonStoreLock(STORE_LOCK_KEY, async () => {
    const posts = await readGalleryPosts();
    const index = posts.findIndex((post) => post.id === id);
    if (index === -1) return null;

    posts[index] = { ...posts[index], views: posts[index].views + 1 };
    await writeGalleryPosts(posts);
    return posts[index];
  });
}

export async function addGalleryComment(
  id: string,
  input: {
    author: string;
    authorId?: string;
    authorGradeId?: import("@/lib/ranking").MemberGradeId;
    content: string;
  }
): Promise<GalleryPost | null> {
  return withJsonStoreLock(STORE_LOCK_KEY, async () => {
    const posts = await readGalleryPosts();
    const index = posts.findIndex((post) => post.id === id);
    if (index === -1) return null;

    const comment: GalleryComment = {
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

    await writeGalleryPosts(posts);
    return posts[index];
  });
}

export async function voteGalleryComment(
  postId: string,
  commentId: string,
  userId: string,
  choice: CommentVoteChoice
): Promise<{ post: GalleryPost; myVote: CommentVoteChoice | null } | null> {
  return withJsonStoreLock(STORE_LOCK_KEY, async () => {
    const posts = await readGalleryPosts();
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

    await writeGalleryPosts(posts);
    return { post: posts[postIndex], myVote };
  });
}

export async function getGalleryPost(id: string): Promise<GalleryPost | null> {
  const posts = await readGalleryPosts();
  return posts.find((post) => post.id === id) ?? null;
}

export async function deleteGalleryPost(id: string): Promise<boolean> {
  return withJsonStoreLock(STORE_LOCK_KEY, async () => {
    const posts = await readGalleryPosts();
    const target = posts.find((post) => post.id === id);
    if (!target) return false;

    await deleteUploadedPublicUrls([target.imageUrl]);

    const next = posts.filter((post) => post.id !== id);
    await writeGalleryPosts(next);
    return true;
  });
}

export type UpdateGalleryPostInput = {
  title?: string;
  location?: string;
  category?: GalleryPost["category"];
  imageUrl?: string;
  caption?: string;
};

export async function updateGalleryPost(
  id: string,
  input: UpdateGalleryPostInput
): Promise<GalleryPost | null> {
  return withJsonStoreLock(STORE_LOCK_KEY, async () => {
    const posts = await readGalleryPosts();
    const index = posts.findIndex((post) => post.id === id);
    if (index === -1) return null;

    const previous = posts[index];
    if (
      input.imageUrl !== undefined &&
      input.imageUrl !== previous.imageUrl
    ) {
      await deleteUploadedPublicUrls([previous.imageUrl]);
    }

    posts[index] = {
      ...posts[index],
      ...input,
    };

    await writeGalleryPosts(posts);
    return posts[index];
  });
}
