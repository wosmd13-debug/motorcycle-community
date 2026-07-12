import { promises as fs } from "fs";
import path from "path";
import {
  canBumpMarketplaceItem,
  normalizeMarketplaceItem,
  seedMarketplaceItems,
  type CommentVoteChoice,
  type CreateMarketplaceItemInput,
  type MarketplaceComment,
  type MarketplaceItem,
  type MarketplaceStatus,
} from "@/lib/marketplace";
import { applyCommentVoteChoice, toggleLikeByUser } from "@/lib/engagement";
import { deleteUploadedPublicUrls } from "@/lib/upload-files";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "marketplace.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(
      DATA_FILE,
      JSON.stringify(seedMarketplaceItems, null, 2),
      "utf8"
    );
  }
}

export async function readMarketplaceItems(): Promise<MarketplaceItem[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const items = JSON.parse(raw) as MarketplaceItem[];
  const normalized = items.map(normalizeMarketplaceItem);

  const needsMigration = items.some(
    (item) =>
      item.imageUrls == null ||
      item.views == null ||
      item.likes == null ||
      item.comments == null ||
      item.status == null
  );

  if (needsMigration) {
    await writeMarketplaceItems(normalized);
  }

  return normalized;
}

async function writeMarketplaceItems(items: MarketplaceItem[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), "utf8");
}

export async function createMarketplaceItem(
  input: CreateMarketplaceItemInput
): Promise<MarketplaceItem> {
  const items = await readMarketplaceItems();
  const item: MarketplaceItem = {
    id: crypto.randomUUID(),
    ...input,
    status: "판매중",
    imageUrls: input.imageUrls ?? [],
    likes: 0,
    views: 0,
    comments: [],
    createdAt: new Date().toISOString(),
  };

  items.unshift(item);
  await writeMarketplaceItems(items);
  return item;
}

export async function getMarketplaceItem(
  id: string
): Promise<MarketplaceItem | null> {
  const items = await readMarketplaceItems();
  return items.find((item) => item.id === id) ?? null;
}

export async function likeMarketplaceItem(
  id: string,
  userId: string
): Promise<{ item: MarketplaceItem; liked: boolean } | null> {
  const items = await readMarketplaceItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const { item, liked } = toggleLikeByUser(items[index], userId);
  items[index] = item;
  await writeMarketplaceItems(items);
  return { item: items[index], liked };
}

export async function viewMarketplaceItem(
  id: string
): Promise<MarketplaceItem | null> {
  const items = await readMarketplaceItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;

  items[index] = { ...items[index], views: items[index].views + 1 };
  await writeMarketplaceItems(items);
  return items[index];
}

export async function addMarketplaceComment(
  id: string,
  input: { author: string; content: string }
): Promise<MarketplaceItem | null> {
  const items = await readMarketplaceItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const comment: MarketplaceComment = {
    id: crypto.randomUUID(),
    author: input.author,
    content: input.content,
    upvotes: 0,
    downvotes: 0,
    createdAt: new Date().toISOString(),
  };

  items[index] = {
    ...items[index],
    comments: [comment, ...items[index].comments],
  };

  await writeMarketplaceItems(items);
  return items[index];
}

export async function voteMarketplaceComment(
  itemId: string,
  commentId: string,
  userId: string,
  choice: CommentVoteChoice
): Promise<{ item: MarketplaceItem; myVote: CommentVoteChoice | null } | null> {
  const items = await readMarketplaceItems();
  const itemIndex = items.findIndex((item) => item.id === itemId);
  if (itemIndex === -1) return null;

  const commentIndex = items[itemIndex].comments.findIndex(
    (comment) => comment.id === commentId
  );
  if (commentIndex === -1) return null;

  const { comment, myVote } = applyCommentVoteChoice(
    items[itemIndex].comments[commentIndex],
    userId,
    choice
  );
  items[itemIndex].comments[commentIndex] = comment;

  await writeMarketplaceItems(items);
  return { item: items[itemIndex], myVote };
}

export async function deleteMarketplaceItem(id: string): Promise<boolean> {
  const items = await readMarketplaceItems();
  const target = items.find((item) => item.id === id);
  if (!target) return false;

  await deleteUploadedPublicUrls(target.imageUrls ?? []);

  const next = items.filter((item) => item.id !== id);
  await writeMarketplaceItems(next);
  return true;
}

export type UpdateMarketplaceItemInput = {
  category?: MarketplaceItem["category"];
  title?: string;
  description?: string;
  price?: number;
  condition?: MarketplaceItem["condition"];
  status?: MarketplaceItem["status"];
  delivery?: MarketplaceItem["delivery"];
  imageUrls?: string[];
  region?: MarketplaceItem["region"];
  location?: string;
  contactMethod?: string;
};

export async function updateMarketplaceItem(
  id: string,
  input: UpdateMarketplaceItemInput
): Promise<MarketplaceItem | null> {
  const items = await readMarketplaceItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const previous = items[index];
  if (input.imageUrls) {
    const removed = (previous.imageUrls ?? []).filter(
      (url) => !input.imageUrls!.includes(url)
    );
    await deleteUploadedPublicUrls(removed);
  }

  const now = new Date().toISOString();
  const nextStatus = input.status;
  const statusChanged =
    nextStatus !== undefined && nextStatus !== previous.status;

  items[index] = {
    ...previous,
    ...input,
    updatedAt: now,
    statusUpdatedAt: statusChanged ? now : previous.statusUpdatedAt,
  };

  await writeMarketplaceItems(items);
  return items[index];
}

export async function updateMarketplaceItemStatus(
  id: string,
  status: MarketplaceStatus
): Promise<MarketplaceItem | null> {
  return updateMarketplaceItem(id, { status });
}

export async function bumpMarketplaceItem(
  id: string
): Promise<MarketplaceItem | "cooldown" | null> {
  const items = await readMarketplaceItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;

  if (!canBumpMarketplaceItem(items[index])) {
    return "cooldown";
  }

  const now = new Date().toISOString();
  items[index] = {
    ...items[index],
    bumpedAt: now,
    updatedAt: now,
  };

  await writeMarketplaceItems(items);
  return items[index];
}
