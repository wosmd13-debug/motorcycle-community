import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

type CommentRow = {
  author: string;
  authorId?: string;
  [key: string]: unknown;
};

type PostRow = {
  author?: string;
  seller?: string;
  submitter?: string;
  authorId?: string;
  sellerId?: string;
  comments?: CommentRow[];
  [key: string]: unknown;
};

type ReportRow = {
  reporterId: string;
  reporterNickname: string;
  [key: string]: unknown;
};

async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile<T>(filename: string, data: T) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DATA_DIR, filename),
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

function syncComments(comments: CommentRow[] | undefined, oldNickname: string, newNickname: string) {
  if (!comments) return comments;
  return comments.map((comment) =>
    comment.author === oldNickname
      ? { ...comment, author: newNickname }
      : comment
  );
}

function syncPostsWithAuthor(
  posts: PostRow[],
  userId: string,
  oldNickname: string,
  newNickname: string
) {
  return posts.map((post) => {
    const next: PostRow = { ...post };

    if (post.authorId === userId && post.author) {
      next.author = newNickname;
    }

    next.comments = syncComments(post.comments, oldNickname, newNickname);
    return next;
  });
}

function syncVideos(
  videos: PostRow[],
  userId: string,
  oldNickname: string,
  newNickname: string
) {
  return videos.map((video) => {
    const next: PostRow = { ...video };

    if (video.authorId === userId && video.submitter) {
      next.submitter = newNickname;
    }

    next.comments = syncComments(video.comments, oldNickname, newNickname);
    return next;
  });
}

function syncReports(reports: ReportRow[], userId: string, newNickname: string) {
  return reports.map((report) =>
    report.reporterId === userId
      ? { ...report, reporterNickname: newNickname }
      : report
  );
}

function syncMarketplaceItems(
  items: PostRow[],
  userId: string,
  oldNickname: string,
  newNickname: string
) {
  return items.map((item) => {
    const next: PostRow = { ...item };

    if (item.sellerId === userId && item.seller) {
      next.seller = newNickname;
    }

    next.comments = syncComments(item.comments, oldNickname, newNickname);
    return next;
  });
}

export async function syncUserNicknameInContent(
  userId: string,
  oldNickname: string,
  newNickname: string
) {
  if (oldNickname === newNickname) return;

  const [board, promo, marketplace, gallery, videos, cafes, reports] =
    await Promise.all([
    readJsonFile<PostRow[]>("board.json", []),
    readJsonFile<PostRow[]>("promo.json", []),
    readJsonFile<PostRow[]>("marketplace.json", []),
    readJsonFile<PostRow[]>("gallery.json", []),
    readJsonFile<PostRow[]>("videos.json", []),
    readJsonFile<PostRow[]>("rider-cafes.json", []),
    readJsonFile<ReportRow[]>("reports.json", []),
  ]);

  await Promise.all([
    writeJsonFile(
      "board.json",
      syncPostsWithAuthor(board, userId, oldNickname, newNickname)
    ),
    writeJsonFile(
      "promo.json",
      syncPostsWithAuthor(promo, userId, oldNickname, newNickname)
    ),
    writeJsonFile(
      "marketplace.json",
      syncMarketplaceItems(marketplace, userId, oldNickname, newNickname)
    ),
    writeJsonFile(
      "gallery.json",
      syncPostsWithAuthor(gallery, userId, oldNickname, newNickname)
    ),
    writeJsonFile(
      "videos.json",
      syncVideos(videos, userId, oldNickname, newNickname)
    ),
    writeJsonFile(
      "rider-cafes.json",
      syncPostsWithAuthor(cafes, userId, oldNickname, newNickname)
    ),
    writeJsonFile("reports.json", syncReports(reports, userId, newNickname)),
  ]);
}

export const WITHDRAWN_MEMBER_LABEL = "탈퇴한 회원";

function isContentAuthor(
  row: PostRow,
  userId: string,
  nickname: string,
  nameField: "author" | "seller" | "submitter"
): boolean {
  if (row.authorId === userId || row.sellerId === userId) return true;
  const name = row[nameField];
  return typeof name === "string" && name === nickname;
}

function anonymizeComments(
  comments: CommentRow[] | undefined,
  userId: string,
  nickname: string
): CommentRow[] | undefined {
  if (!comments) return comments;

  return comments.map((comment) => {
    const commentAuthorId =
      typeof comment.authorId === "string" ? comment.authorId : undefined;

    if (commentAuthorId === userId || comment.author === nickname) {
      const next = { ...comment, author: WITHDRAWN_MEMBER_LABEL };
      delete next.authorId;
      return next;
    }

    return comment;
  });
}

function anonymizePostsWithAuthor(
  posts: PostRow[],
  userId: string,
  nickname: string,
  nameField: "author" | "seller" | "submitter" = "author"
) {
  return posts.map((post) => {
    const next: PostRow = { ...post };

    if (isContentAuthor(post, userId, nickname, nameField)) {
      next[nameField] = WITHDRAWN_MEMBER_LABEL;
      delete next.authorId;
      delete next.sellerId;
    }

    next.comments = anonymizeComments(post.comments, userId, nickname);
    return next;
  });
}

type MeetupRow = {
  author?: string;
  authorId?: string;
  participants?: Array<{ userId: string; nickname: string; [key: string]: unknown }>;
  [key: string]: unknown;
};

function purgeMeetups(meetups: MeetupRow[], userId: string, nickname: string) {
  return meetups.map((meetup) => {
    const next: MeetupRow = { ...meetup };

    next.participants = (meetup.participants ?? []).filter(
      (participant) => participant.userId !== userId
    );

    if (meetup.authorId === userId || meetup.author === nickname) {
      next.author = WITHDRAWN_MEMBER_LABEL;
      delete next.authorId;
    }

    return next;
  });
}

type MemberRouteRow = {
  authorId?: string;
  [key: string]: unknown;
};

export async function purgeUserContentOnWithdrawal(
  userId: string,
  nickname: string
) {
  const [board, promo, marketplace, gallery, videos, cafes, reports, meetups, memberRoutes] =
    await Promise.all([
      readJsonFile<PostRow[]>("board.json", []),
      readJsonFile<PostRow[]>("promo.json", []),
      readJsonFile<PostRow[]>("marketplace.json", []),
      readJsonFile<PostRow[]>("gallery.json", []),
      readJsonFile<PostRow[]>("videos.json", []),
      readJsonFile<PostRow[]>("rider-cafes.json", []),
      readJsonFile<ReportRow[]>("reports.json", []),
      readJsonFile<MeetupRow[]>("meetups.json", []),
      readJsonFile<MemberRouteRow[]>("member-routes.json", []),
    ]);

  await Promise.all([
    writeJsonFile(
      "board.json",
      anonymizePostsWithAuthor(board, userId, nickname, "author")
    ),
    writeJsonFile(
      "promo.json",
      anonymizePostsWithAuthor(promo, userId, nickname, "author")
    ),
    writeJsonFile(
      "marketplace.json",
      anonymizePostsWithAuthor(marketplace, userId, nickname, "seller")
    ),
    writeJsonFile(
      "gallery.json",
      anonymizePostsWithAuthor(gallery, userId, nickname, "author")
    ),
    writeJsonFile(
      "videos.json",
      anonymizePostsWithAuthor(videos, userId, nickname, "submitter")
    ),
    writeJsonFile(
      "rider-cafes.json",
      anonymizePostsWithAuthor(cafes, userId, nickname, "author")
    ),
    writeJsonFile(
      "reports.json",
      reports.filter((report) => report.reporterId !== userId)
    ),
    writeJsonFile("meetups.json", purgeMeetups(meetups, userId, nickname)),
    writeJsonFile(
      "member-routes.json",
      memberRoutes.filter((route) => route.authorId !== userId)
    ),
  ]);
}
