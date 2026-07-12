import { readBoardPosts } from "@/lib/board-store";
import { readGalleryPosts } from "@/lib/gallery-store";
import { isOperatorUser } from "@/lib/admin";
import { sumMissionPointsByUser } from "@/lib/mission-store";
import { readPromoPosts } from "@/lib/promo-store";
import {
  getGradeForActivity,
  OPERATOR_GRADE,
  RANKING_POINTS,
  type MemberGrade,
  type MemberGradeId,
  type MemberRankBreakdown,
  type MemberRankEntry,
} from "@/lib/ranking";
import { readRiderCafes } from "@/lib/rider-cafe-store";
import { sumShopSpentByUser } from "@/lib/shop-store";
import { readUsers } from "@/lib/user-store";
import { readVideos } from "@/lib/video-store";
import type { User } from "@/lib/users";

type RankAccumulator = {
  userId: string;
  loginId: string;
  nickname: string;
  joinedAt: string;
  role?: User["role"];
  points: number;
  posts: number;
  comments: number;
  likesReceived: number;
  viewsReceived: number;
  breakdown: MemberRankBreakdown;
};

type CommentLike = {
  author: string;
  authorId?: string;
  upvotes: number;
};

type PostLike = {
  authorId?: string;
  author?: string;
  submitter?: string;
  likes: number;
  views: number;
  comments?: CommentLike[];
};

function getPostAuthor(post: PostLike): string {
  return post.author ?? post.submitter ?? "";
}

function createAccumulator(user: User): RankAccumulator {
  return {
    userId: user.id,
    loginId: user.loginId,
    nickname: user.nickname,
    joinedAt: user.createdAt,
    role: user.role,
    points: RANKING_POINTS.signup,
    posts: 0,
    comments: 0,
    likesReceived: 0,
    viewsReceived: 0,
    breakdown: {
      signup: RANKING_POINTS.signup,
      posts: 0,
      comments: 0,
      engagement: 0,
      missions: 0,
      shopSpend: 0,
    },
  };
}

function addPoints(
  accumulator: RankAccumulator,
  amount: number,
  bucket: keyof MemberRankBreakdown
) {
  if (amount === 0) return;
  accumulator.points += amount;
  accumulator.breakdown[bucket] += amount;
}

function applyShopSpend(
  accumulator: RankAccumulator,
  spent: number
) {
  if (spent <= 0) return;
  const deduct = Math.min(accumulator.points, spent);
  accumulator.points -= deduct;
  accumulator.breakdown.shopSpend = deduct;
}

function resolveUserId(
  authorId: string | undefined,
  author: string,
  nicknameToUserId: Map<string, string>
): string | null {
  if (authorId) return authorId;
  return nicknameToUserId.get(author) ?? null;
}

function getAccumulator(
  map: Map<string, RankAccumulator>,
  userId: string,
  usersById: Map<string, User>
): RankAccumulator | null {
  const existing = map.get(userId);
  if (existing) return existing;

  const user = usersById.get(userId);
  if (!user) return null;

  const accumulator = createAccumulator(user);
  map.set(userId, accumulator);
  return accumulator;
}

function processPostEngagement(
  map: Map<string, RankAccumulator>,
  usersById: Map<string, User>,
  post: PostLike,
  nicknameToUserId: Map<string, string>
) {
  const authorId = resolveUserId(post.authorId, getPostAuthor(post), nicknameToUserId);
  if (!authorId) return;

  const accumulator = getAccumulator(map, authorId, usersById);
  if (!accumulator) return;

  const likePoints = post.likes * RANKING_POINTS.postLike;
  const viewPoints = Math.floor(post.views / 10) * RANKING_POINTS.postViewPerTen;
  const commentOnPostPoints =
    (post.comments?.length ?? 0) * RANKING_POINTS.commentOnPost;

  accumulator.likesReceived += post.likes;
  accumulator.viewsReceived += post.views;

  addPoints(accumulator, likePoints + viewPoints + commentOnPostPoints, "engagement");
}

function processComments(
  map: Map<string, RankAccumulator>,
  usersById: Map<string, User>,
  comments: CommentLike[],
  nicknameToUserId: Map<string, string>
) {
  for (const comment of comments) {
    const authorId = resolveUserId(comment.authorId, comment.author, nicknameToUserId);
    if (!authorId) continue;

    const accumulator = getAccumulator(map, authorId, usersById);
    if (!accumulator) continue;

    accumulator.comments += 1;
    addPoints(accumulator, RANKING_POINTS.comment, "comments");

    if (comment.upvotes > 0) {
      addPoints(
        accumulator,
        comment.upvotes * RANKING_POINTS.commentUpvote,
        "engagement"
      );
    }
  }
}

function awardPostCreation(
  map: Map<string, RankAccumulator>,
  usersById: Map<string, User>,
  userId: string | null,
  points: number
) {
  if (!userId) return;
  const accumulator = getAccumulator(map, userId, usersById);
  if (!accumulator) return;

  accumulator.posts += 1;
  addPoints(accumulator, points, "posts");
}

async function buildRankMap(): Promise<Map<string, RankAccumulator>> {
  const users = await readUsers();
  const usersById = new Map(users.map((user) => [user.id, user]));
  const nicknameToUserId = new Map(users.map((user) => [user.nickname, user.id]));
  const map = new Map<string, RankAccumulator>();

  for (const user of users) {
    map.set(user.id, createAccumulator(user));
  }

  const [boardPosts, promoPosts, galleryPosts, videos, cafes] = await Promise.all([
    readBoardPosts(),
    readPromoPosts(),
    readGalleryPosts(),
    readVideos(),
    readRiderCafes(),
  ]);

  for (const post of boardPosts) {
    awardPostCreation(
      map,
      usersById,
      resolveUserId(post.authorId, post.author, nicknameToUserId),
      RANKING_POINTS.boardPost
    );
    processPostEngagement(map, usersById, post, nicknameToUserId);
    processComments(map, usersById, post.comments, nicknameToUserId);
  }

  for (const post of promoPosts) {
    awardPostCreation(
      map,
      usersById,
      resolveUserId(post.authorId, post.author, nicknameToUserId),
      RANKING_POINTS.promoPost
    );
    processPostEngagement(map, usersById, post, nicknameToUserId);
    processComments(map, usersById, post.comments, nicknameToUserId);
  }

  for (const post of galleryPosts) {
    awardPostCreation(
      map,
      usersById,
      resolveUserId(post.authorId, post.author, nicknameToUserId),
      RANKING_POINTS.galleryPost
    );
    processPostEngagement(map, usersById, post, nicknameToUserId);
    processComments(map, usersById, post.comments, nicknameToUserId);
  }

  for (const post of videos) {
    awardPostCreation(
      map,
      usersById,
      resolveUserId(post.authorId, post.submitter, nicknameToUserId),
      RANKING_POINTS.videoPost
    );
    processPostEngagement(map, usersById, post, nicknameToUserId);
    processComments(map, usersById, post.comments, nicknameToUserId);
  }

  for (const cafe of cafes) {
    awardPostCreation(
      map,
      usersById,
      resolveUserId(cafe.authorId, cafe.author, nicknameToUserId),
      RANKING_POINTS.cafePost
    );
    processPostEngagement(map, usersById, cafe, nicknameToUserId);
  }

  const missionPoints = await sumMissionPointsByUser();
  for (const [userId, points] of missionPoints) {
    const accumulator = getAccumulator(map, userId, usersById);
    if (!accumulator) continue;
    addPoints(accumulator, points, "missions");
  }

  const shopSpent = await sumShopSpentByUser();
  for (const [userId, spent] of shopSpent) {
    const accumulator = getAccumulator(map, userId, usersById);
    if (!accumulator) continue;
    applyShopSpend(accumulator, spent);
  }

  return map;
}

function isOperatorAccumulator(accumulator: RankAccumulator): boolean {
  return (
    accumulator.role === "operator" ||
    isOperatorUser({
      id: accumulator.userId,
      loginId: accumulator.loginId,
      nickname: accumulator.nickname,
    })
  );
}

function resolveMemberGrade(accumulator: RankAccumulator): MemberGrade {
  if (isOperatorAccumulator(accumulator)) {
    return OPERATOR_GRADE;
  }
  return getGradeForActivity({
    posts: accumulator.posts,
    comments: accumulator.comments,
    likesReceived: accumulator.likesReceived,
    viewsReceived: accumulator.viewsReceived,
  });
}

function sortAccumulators(values: RankAccumulator[]): RankAccumulator[] {
  return [...values].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });
}

/** 운영자는 회원 랭킹 집계·순위 산정에서 제외 */
function competitiveAccumulators(
  map: Map<string, RankAccumulator>
): RankAccumulator[] {
  return sortAccumulators(
    [...map.values()].filter((entry) => !isOperatorAccumulator(entry))
  );
}

function toRankEntry(accumulator: RankAccumulator, rank: number): MemberRankEntry {
  return {
    userId: accumulator.userId,
    loginId: accumulator.loginId,
    nickname: accumulator.nickname,
    points: accumulator.points,
    rank,
    grade: resolveMemberGrade(accumulator),
    activity: {
      posts: accumulator.posts,
      comments: accumulator.comments,
      likesReceived: accumulator.likesReceived,
      viewsReceived: accumulator.viewsReceived,
    },
    breakdown: accumulator.breakdown,
    joinedAt: accumulator.joinedAt,
  };
}

export async function getMemberRankings(options?: {
  grade?: MemberGradeId | "all";
  limit?: number;
}): Promise<MemberRankEntry[]> {
  const map = await buildRankMap();
  const gradeFilter = options?.grade ?? "all";
  const limit = options?.limit ?? 100;

  let entries = competitiveAccumulators(map).map((accumulator, index) =>
    toRankEntry(accumulator, index + 1)
  );

  if (gradeFilter !== "all") {
    entries = entries.filter((entry) => entry.grade.id === gradeFilter);
  }

  return entries.slice(0, limit);
}

export async function getMemberRankingByUserId(
  userId: string
): Promise<MemberRankEntry | null> {
  const map = await buildRankMap();
  const accumulator = map.get(userId);
  if (!accumulator) return null;

  // 운영자는 랭킹 순위·목록에서 제외
  if (isOperatorAccumulator(accumulator)) {
    return null;
  }

  const sorted = competitiveAccumulators(map);
  const index = sorted.findIndex((entry) => entry.userId === userId);
  if (index === -1) return null;

  return toRankEntry(sorted[index], index + 1);
}

export async function getMemberRankingSummary(limit = 8): Promise<MemberRankEntry[]> {
  return getMemberRankings({ limit });
}

export async function getGradesByNicknames(
  nicknames: string[]
): Promise<Record<string, import("@/lib/ranking").MemberGradeId>> {
  const wanted = new Set(
    nicknames.map((nickname) => nickname.trim()).filter(Boolean)
  );

  if (wanted.size === 0) {
    return {};
  }

  const [rankings, users] = await Promise.all([
    getMemberRankings({ grade: "all", limit: 1000 }),
    readUsers(),
  ]);
  const gradesByNickname: Record<string, import("@/lib/ranking").MemberGradeId> =
    {};

  for (const user of users) {
    if (!wanted.has(user.nickname)) continue;
    if (isOperatorUser(user)) {
      gradesByNickname[user.nickname] = "operator";
    }
  }

  for (const entry of rankings) {
    if (!wanted.has(entry.nickname)) continue;
    gradesByNickname[entry.nickname] = entry.grade.id;
  }

  return gradesByNickname;
}
