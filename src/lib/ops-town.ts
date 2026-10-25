import { readBoardPosts } from "@/lib/board-store";
import { readFeedback } from "@/lib/feedback-store";
import { readGalleryPosts } from "@/lib/gallery-store";
import { readMarketplaceItems } from "@/lib/marketplace-store";
import { readMeetups } from "@/lib/meetup-store";
import { readPromoPosts } from "@/lib/promo-store";
import { readReports } from "@/lib/report-store";
import type { ReportTargetType } from "@/lib/reports";
import { readUsers } from "@/lib/user-store";
import { readVideos } from "@/lib/video-store";

export type TownBuildingKey =
  | "board"
  | "meetups"
  | "gallery"
  | "videos"
  | "promo"
  | "marketplace";

export type TownBuilding = {
  key: TownBuildingKey;
  label: string;
  href: string;
  count: number;
  comments: number;
  views: number;
  newThisWeek: number;
  alert: boolean;
  summary: string;
};

export type TownQuestKind = "report" | "feedback" | "cleanup" | "welcome" | "polish";

export type TownQuest = {
  id: string;
  kind: TownQuestKind;
  text: string;
  href: string;
  exp: number;
};

export type TownSnapshot = {
  generatedAt: string;
  level: number;
  exp: number;
  expForNext: number;
  expInLevel: number;
  coins: number;
  members: number;
  newMembersThisWeek: number;
  pendingReports: number;
  pendingFeedback: number;
  safety: "peace" | "caution" | "danger";
  buildings: TownBuilding[];
  quests: TownQuest[];
  riders: string[];
};

type CommentLike = { author?: string; content?: string; createdAt?: string };
type ContentLike = {
  id: string;
  title?: string;
  author?: string;
  views?: number;
  createdAt?: string;
  comments?: CommentLike[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const EXP_PER_LEVEL = 100;
const EXP_PER_POST = 10;
const EXP_PER_COMMENT = 3;
const MAX_RIDERS = 8;
const MAX_QUESTS = 6;

const REPORT_TARGET_BUILDING: Record<ReportTargetType, TownBuildingKey> = {
  board: "board",
  gallery: "gallery",
  video: "videos",
  promo: "promo",
  marketplace: "marketplace",
};

function isWithinDays(iso: string | undefined, days: number, now: number) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return !Number.isNaN(t) && t <= now && now - t < days * DAY_MS;
}

function commentsOf(item: ContentLike): CommentLike[] {
  return Array.isArray(item.comments) ? item.comments : [];
}

function topByViews(items: ContentLike[]) {
  return [...items].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))[0];
}

function shorten(text: string | undefined, max = 18) {
  const value = (text ?? "").trim();
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

/** 운영자 전용 픽셀 마을 대시보드 요약 (데이터를 읽기만 함) */
export async function buildTownSnapshot(): Promise<TownSnapshot> {
  const now = Date.now();
  const [board, gallery, videos, marketplace, promo, meetups, reports, feedback, users] =
    await Promise.all([
      readBoardPosts(),
      readGalleryPosts(),
      readVideos(),
      readMarketplaceItems(),
      readPromoPosts(),
      readMeetups(),
      readReports(),
      readFeedback(),
      readUsers(),
    ]);

  const alertBuildings = new Set<TownBuildingKey>();
  const quests: TownQuest[] = [];

  const pendingReportList = reports.filter((report) => report.status === "pending");
  for (const report of pendingReportList) {
    alertBuildings.add(REPORT_TARGET_BUILDING[report.targetType]);
  }
  for (const report of pendingReportList.slice(0, 3)) {
    quests.push({
      id: `report-${report.id}`,
      kind: "report",
      text: `신고 처리: "${shorten(report.targetTitle)}" (${report.reason})`,
      href: "/admin/reports",
      exp: 30,
    });
  }

  const pendingFeedback = feedback.filter((entry) => entry.status === "pending").length;
  if (pendingFeedback > 0) {
    quests.push({
      id: "feedback",
      kind: "feedback",
      text: `건의·문의 ${pendingFeedback}건 답하기`,
      href: "/admin/feedback",
      exp: 15,
    });
  }

  // "gg"처럼 2글자 이하 댓글은 테스트·도배일 수 있어 확인 권장
  const cleanupSources: Array<[TownBuildingKey, string, ContentLike[]]> = [
    ["board", "/board", board],
    ["gallery", "/gallery", gallery],
    ["videos", "/videos", videos],
  ];
  for (const [key, base, items] of cleanupSources) {
    for (const item of items) {
      const tiny = commentsOf(item).filter(
        (comment) => (comment.content ?? "").trim().length <= 2
      );
      if (tiny.length === 0) continue;
      alertBuildings.add(key);
      quests.push({
        id: `cleanup-${item.id}`,
        kind: "cleanup",
        text: `"${shorten(item.title)}"의 짧은 댓글 ${tiny.length}개 확인하기`,
        href: key === "videos" ? base : `${base}/${item.id}`,
        exp: 20,
      });
    }
  }

  const lonelyPost = board
    .filter((post) => commentsOf(post).length === 0)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))[0];
  if (lonelyPost) {
    quests.push({
      id: `welcome-${lonelyPost.id}`,
      kind: "welcome",
      text: `"${shorten(lonelyPost.title)}" 글에 첫 댓글 남기기`,
      href: `/board/${lonelyPost.id}`,
      exp: 15,
    });
  }

  const bareVideo = videos.find((video) => !(video.description ?? "").trim());
  if (bareVideo) {
    quests.push({
      id: `polish-${bareVideo.id}`,
      kind: "polish",
      text: `영상 "${shorten(bareVideo.title)}"에 소개글 달기`,
      href: "/videos",
      exp: 10,
    });
  }

  const building = (
    key: TownBuildingKey,
    label: string,
    href: string,
    items: ContentLike[],
    summary: string
  ): TownBuilding => ({
    key,
    label,
    href,
    count: items.length,
    comments: items.reduce((sum, item) => sum + commentsOf(item).length, 0),
    views: items.reduce((sum, item) => sum + (item.views ?? 0), 0),
    newThisWeek: items.filter((item) => isWithinDays(item.createdAt, 7, now)).length,
    alert: alertBuildings.has(key),
    summary,
  });

  const topSummary = (items: ContentLike[], what: string, empty: string) => {
    const top = topByViews(items);
    return top ? `인기 ${what}은 "${shorten(top.title)}" (조회 ${top.views ?? 0})` : empty;
  };

  const upcomingMeetups = meetups.filter(
    (meetup) => !meetup.cancelled && new Date(meetup.meetupDate).getTime() >= now
  ).length;
  const forSale = marketplace.filter((item) => item.status !== "판매완료").length;

  const buildings: TownBuilding[] = [
    building("board", "게시판", "/board", board, topSummary(board, "글", "아직 글이 없어요.")),
    building("meetups", "모임", "/meetups", meetups, `다가오는 모임 ${upcomingMeetups}개가 기다리고 있어요.`),
    building("gallery", "사진관", "/gallery", gallery, topSummary(gallery, "사진", "아직 사진이 없어요.")),
    building("videos", "극장", "/videos", videos, topSummary(videos, "영상", "아직 영상이 없어요.")),
    building("promo", "홍보거리", "/promo", promo, `제휴 가게 ${promo.length}곳이 입점해 있어요.`),
    building("marketplace", "장터", "/marketplace", marketplace, `판매 중인 매물 ${forSale}개가 있어요.`),
  ];

  const totalPosts = buildings.reduce((sum, b) => sum + b.count, 0);
  const totalComments = buildings.reduce((sum, b) => sum + b.comments, 0);
  const exp = totalPosts * EXP_PER_POST + totalComments * EXP_PER_COMMENT;

  // 최근 30일 활동이 많은 회원이 마을을 달림
  const activity = new Map<string, number>();
  const bump = (name: string | undefined, iso: string | undefined) => {
    if (!name || !isWithinDays(iso, 30, now)) return;
    activity.set(name, (activity.get(name) ?? 0) + 1);
  };
  for (const items of [board, gallery, videos, promo] as ContentLike[][]) {
    for (const item of items) {
      bump(item.author, item.createdAt);
      for (const comment of commentsOf(item)) bump(comment.author, comment.createdAt);
    }
  }
  let riders = [...activity.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
  if (riders.length === 0) riders = users.map((user) => user.nickname);

  const pendingReports = pendingReportList.length;

  return {
    generatedAt: new Date(now).toISOString(),
    level: Math.floor(exp / EXP_PER_LEVEL) + 1,
    exp,
    expForNext: EXP_PER_LEVEL,
    expInLevel: exp % EXP_PER_LEVEL,
    coins: buildings.reduce((sum, b) => sum + b.views, 0),
    members: users.length,
    newMembersThisWeek: users.filter((user) => isWithinDays(user.createdAt, 7, now)).length,
    pendingReports,
    pendingFeedback,
    safety: pendingReports === 0 ? "peace" : pendingReports < 3 ? "caution" : "danger",
    buildings,
    quests: quests.slice(0, MAX_QUESTS),
    riders: riders.slice(0, MAX_RIDERS),
  };
}
