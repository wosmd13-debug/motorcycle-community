import {
  addMissionCheckIn,
  addMissionClaim,
  countMissionLikesInRange,
  getUserCheckIns,
  getUserMissionClaims,
  hasClaim,
} from "@/lib/mission-store";
import { readBoardPosts } from "@/lib/board-store";
import { readGalleryPosts } from "@/lib/gallery-store";
import { readPromoPosts } from "@/lib/promo-store";
import { readRiderCafes } from "@/lib/rider-cafe-store";
import { readVideos } from "@/lib/video-store";
import {
  ALL_MISSIONS,
  calcStreak,
  DAILY_MISSIONS,
  getMissionDefinition,
  getNextSeoulMidnightIso,
  getNextSeoulWeekStartIso,
  getSeoulDateKey,
  getSeoulDayBounds,
  getSeoulWeekBounds,
  getSeoulWeekKey,
  getSeoulWeekLabel,
  periodKeyForMission,
  WEEKLY_MISSIONS,
  type MissionDashboard,
  type MissionDefinition,
  type MissionId,
  type MissionProgressView,
} from "@/lib/missions";

type ActivityCounts = {
  boardPosts: number;
  galleryPosts: number;
  comments: number;
  likesGiven: number;
  contentPosts: number;
  checkInDays: number;
};

function inRange(iso: string, start: Date, end: Date): boolean {
  const time = new Date(iso).getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function matchesUser(
  authorId: string | undefined,
  author: string | undefined,
  userId: string,
  nickname: string
): boolean {
  if (authorId) return authorId === userId;
  return Boolean(author) && author === nickname;
}

async function countUserActivity(
  userId: string,
  nickname: string,
  start: Date,
  end: Date
) {
  const [boardPosts, promoPosts, galleryPosts, videos, cafes] = await Promise.all([
    readBoardPosts(),
    readPromoPosts(),
    readGalleryPosts(),
    readVideos(),
    readRiderCafes(),
  ]);

  let boardCount = 0;
  let galleryCount = 0;
  let comments = 0;
  let contentPosts = 0;

  const bumpComment = (comment: {
    author: string;
    authorId?: string;
    createdAt: string;
  }) => {
    if (
      matchesUser(comment.authorId, comment.author, userId, nickname) &&
      inRange(comment.createdAt, start, end)
    ) {
      comments += 1;
    }
  };

  for (const post of boardPosts) {
    if (
      matchesUser(post.authorId, post.author, userId, nickname) &&
      inRange(post.createdAt, start, end)
    ) {
      boardCount += 1;
      contentPosts += 1;
    }
    post.comments?.forEach(bumpComment);
  }

  for (const post of promoPosts) {
    if (
      matchesUser(post.authorId, post.author, userId, nickname) &&
      inRange(post.createdAt, start, end)
    ) {
      contentPosts += 1;
    }
    post.comments?.forEach(bumpComment);
  }

  for (const post of galleryPosts) {
    if (
      matchesUser(post.authorId, post.author, userId, nickname) &&
      inRange(post.createdAt, start, end)
    ) {
      galleryCount += 1;
      contentPosts += 1;
    }
    post.comments?.forEach((comment) =>
      bumpComment({
        author: comment.author,
        authorId: (comment as { authorId?: string }).authorId,
        createdAt: comment.createdAt,
      })
    );
  }

  for (const post of videos) {
    if (
      matchesUser(post.authorId, post.submitter, userId, nickname) &&
      inRange(post.createdAt, start, end)
    ) {
      contentPosts += 1;
    }
    post.comments?.forEach((comment) =>
      bumpComment({
        author: comment.author,
        authorId: (comment as { authorId?: string }).authorId,
        createdAt: comment.createdAt,
      })
    );
  }

  for (const cafe of cafes) {
    if (
      matchesUser(cafe.authorId, cafe.author, userId, nickname) &&
      inRange(cafe.createdAt, start, end)
    ) {
      contentPosts += 1;
    }
  }

  return {
    boardPosts: boardCount,
    galleryPosts: galleryCount,
    comments,
    contentPosts,
  };
}

function progressForMission(
  mission: MissionDefinition,
  counts: ActivityCounts,
  streakDaysInWeek: number,
  prerequisitesDone: boolean
): number {
  switch (mission.id) {
    case "daily_checkin":
      return Math.min(counts.checkInDays, mission.target);
    case "daily_comment":
      return Math.min(counts.comments, mission.target);
    case "daily_board":
      return Math.min(counts.boardPosts, mission.target);
    case "daily_gallery":
      return Math.min(counts.galleryPosts, mission.target);
    case "daily_like":
      return Math.min(counts.likesGiven, mission.target);
    case "daily_clear":
      return prerequisitesDone ? 1 : 0;
    case "weekly_posts":
      return Math.min(counts.contentPosts, mission.target);
    case "weekly_comments":
      return Math.min(counts.comments, mission.target);
    case "weekly_gallery":
      return Math.min(counts.galleryPosts, mission.target);
    case "weekly_streak":
      return Math.min(streakDaysInWeek, mission.target);
    case "weekly_clear":
      return prerequisitesDone ? 1 : 0;
    default:
      return 0;
  }
}

function toProgressView(
  mission: MissionDefinition,
  current: number,
  claimed: boolean,
  locked = false,
  lockReason?: string
): MissionProgressView {
  const target = mission.target;
  const completed = current >= target;
  const percent = Math.min(100, Math.round((current / Math.max(target, 1)) * 100));
  return {
    definition: mission,
    periodKey: periodKeyForMission(mission),
    current: Math.min(current, target),
    target,
    percent,
    completed,
    claimed,
    claimable: completed && !claimed && !locked,
    locked,
    lockReason,
  };
}

export async function getMissionDashboard(input: {
  userId: string;
  nickname: string;
}): Promise<MissionDashboard> {
  const now = new Date();
  const dateKey = getSeoulDateKey(now);
  const weekKey = getSeoulWeekKey(now);
  const dayBounds = getSeoulDayBounds(dateKey);
  const weekBounds = getSeoulWeekBounds(now);

  const [checkIns, claims, dailyActivity, weeklyActivity, dailyLikes, weeklyLikes] =
    await Promise.all([
      getUserCheckIns(input.userId),
      getUserMissionClaims(input.userId),
      countUserActivity(input.userId, input.nickname, dayBounds.start, dayBounds.end),
      countUserActivity(
        input.userId,
        input.nickname,
        weekBounds.start,
        weekBounds.end
      ),
      countMissionLikesInRange(input.userId, dayBounds.start, dayBounds.end),
      countMissionLikesInRange(input.userId, weekBounds.start, weekBounds.end),
    ]);

  const streak = calcStreak(checkIns, input.userId, dateKey);
  const checkInSet = new Set(checkIns.map((item) => item.dateKey));
  const weekdayLabels = ["월", "화", "수", "목", "금", "토", "일"];
  const weekDays = weekBounds.dateKeys.map((key, index) => ({
    dateKey: key,
    weekday: weekdayLabels[index] ?? "",
    checked: checkInSet.has(key),
    isToday: key === dateKey,
  }));
  const weekCheckInDays = weekDays.filter((day) => day.checked).length;

  const claimedSet = new Set(
    claims.map((claim) => `${claim.missionId}:${claim.periodKey}`)
  );

  const dailyCounts: ActivityCounts = {
    ...dailyActivity,
    likesGiven: dailyLikes,
    checkInDays: streak.todayCheckedIn ? 1 : 0,
  };

  const weeklyCounts: ActivityCounts = {
    ...weeklyActivity,
    likesGiven: weeklyLikes,
    checkInDays: weekCheckInDays,
  };

  const coreDaily = DAILY_MISSIONS.filter((mission) => mission.id !== "daily_clear");
  const coreWeekly = WEEKLY_MISSIONS.filter((mission) => mission.id !== "weekly_clear");

  const dailyCoreViews = coreDaily.map((mission) => {
    const current = progressForMission(mission, dailyCounts, weekCheckInDays, false);
    const periodKey = periodKeyForMission(mission, now);
    const claimed = claimedSet.has(`${mission.id}:${periodKey}`);
    // 출석 미션: 미출석이어도 버튼으로 바로 완료·수령 가능
    if (mission.action === "checkin" && !claimed) {
      return {
        ...toProgressView(mission, current, claimed),
        claimable: true,
        completed: current >= mission.target,
      };
    }
    return toProgressView(mission, current, claimed);
  });

  const weeklyCoreViews = coreWeekly.map((mission) => {
    const current = progressForMission(mission, weeklyCounts, weekCheckInDays, false);
    const periodKey = periodKeyForMission(mission, now);
    return toProgressView(
      mission,
      current,
      claimedSet.has(`${mission.id}:${periodKey}`)
    );
  });

  const dailyCoreCompleted = dailyCoreViews.every((item) => {
    if (item.definition.action === "checkin") {
      return item.completed || item.claimed;
    }
    return item.completed;
  });
  const weeklyAllDone = weeklyCoreViews.every((item) => item.completed);

  const dailyClear = DAILY_MISSIONS.find((mission) => mission.id === "daily_clear")!;
  const weeklyClear = WEEKLY_MISSIONS.find((mission) => mission.id === "weekly_clear")!;

  const daily = [
    ...dailyCoreViews,
    toProgressView(
      dailyClear,
      dailyCoreCompleted ? 1 : 0,
      claimedSet.has(`${dailyClear.id}:${periodKeyForMission(dailyClear, now)}`),
      !dailyCoreCompleted,
      dailyCoreCompleted ? undefined : "나머지 일일 미션을 모두 완료하면 열려요"
    ),
  ];

  const weekly = [
    ...weeklyCoreViews,
    toProgressView(
      weeklyClear,
      weeklyAllDone ? 1 : 0,
      claimedSet.has(`${weeklyClear.id}:${periodKeyForMission(weeklyClear, now)}`),
      !weeklyAllDone,
      weeklyAllDone ? undefined : "나머지 주간 미션을 모두 완료하면 열려요"
    ),
  ];

  const totalEarnedPoints = claims.reduce((sum, claim) => sum + claim.points, 0);

  return {
    dateKey,
    weekKey,
    weekLabel: getSeoulWeekLabel(now),
    streak: streak.current,
    longestStreak: streak.longest,
    todayCheckedIn: streak.todayCheckedIn,
    weekDays,
    daily,
    weekly,
    dailyCompletedCount: daily.filter((item) => item.completed || item.claimed).length,
    weeklyCompletedCount: weekly.filter((item) => item.completed).length,
    dailyClaimablePoints: daily
      .filter((item) => item.claimable)
      .reduce((sum, item) => sum + item.definition.points, 0),
    weeklyClaimablePoints: weekly
      .filter((item) => item.claimable)
      .reduce((sum, item) => sum + item.definition.points, 0),
    totalEarnedPoints,
    endsAt: {
      daily: getNextSeoulMidnightIso(now),
      weekly: getNextSeoulWeekStartIso(now),
    },
  };
}

export async function performMissionCheckIn(userId: string) {
  const dateKey = getSeoulDateKey();
  return addMissionCheckIn(userId, dateKey);
}

export async function claimMissionReward(input: {
  userId: string;
  nickname: string;
  missionId: MissionId;
}) {
  const definition = getMissionDefinition(input.missionId);
  if (!definition) {
    throw new Error("존재하지 않는 미션입니다.");
  }

  if (definition.action === "checkin") {
    await performMissionCheckIn(input.userId);
  }

  const dashboard = await getMissionDashboard(input);
  const list = definition.period === "daily" ? dashboard.daily : dashboard.weekly;
  const view = list.find((item) => item.definition.id === input.missionId);
  if (!view) {
    throw new Error("미션 정보를 찾을 수 없습니다.");
  }
  if (view.locked) {
    throw new Error(view.lockReason ?? "아직 잠긴 미션입니다.");
  }
  if (!view.completed && definition.action !== "checkin") {
    throw new Error("미션을 아직 완료하지 않았습니다.");
  }
  if (view.claimed) {
    throw new Error("이미 보상을 받은 미션입니다.");
  }

  const periodKey = periodKeyForMission(definition);
  const already = await hasClaim(input.userId, input.missionId, periodKey);
  if (already) {
    throw new Error("이미 보상을 받은 미션입니다.");
  }

  // Re-check completion after potential check-in
  const refreshed = await getMissionDashboard(input);
  const refreshedView = (definition.period === "daily"
    ? refreshed.daily
    : refreshed.weekly
  ).find((item) => item.definition.id === input.missionId);

  if (!refreshedView?.completed) {
    throw new Error("미션을 아직 완료하지 않았습니다.");
  }

  const claim = await addMissionClaim({
    userId: input.userId,
    missionId: input.missionId,
    periodKey,
    points: definition.points,
  });

  try {
    const { syncShopWallet } = await import("@/lib/shop-server");
    await syncShopWallet(input.userId);
  } catch {
    // 상점 지갑 동기화 실패해도 미션 보상은 유지
  }

  const nextDashboard = await getMissionDashboard(input);
  return { claim, dashboard: nextDashboard };
}

export function listMissionCatalog() {
  return ALL_MISSIONS;
}
