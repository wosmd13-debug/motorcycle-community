export const reportTargetTypes = [
  "board",
  "gallery",
  "video",
  "promo",
  "marketplace",
] as const;

export type ReportTargetType = (typeof reportTargetTypes)[number];

export const reportReasons = [
  "음란·불건전",
  "불법 촬영물",
  "사기·허위광고",
  "욕설·비방",
  "스팸·도배",
  "기타",
] as const;

export type ReportReason = (typeof reportReasons)[number];

export type ReportStatus = "pending" | "resolved" | "dismissed";

export type Report = {
  id: string;
  reporterId: string;
  reporterNickname: string;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  reason: ReportReason;
  detail: string;
  status: ReportStatus;
  adminNote?: string;
  createdAt: string;
  resolvedAt?: string;
};

export type CreateReportInput = {
  reporterId: string;
  reporterNickname: string;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  reason: ReportReason;
  detail?: string;
};

export const reportTargetLabels: Record<ReportTargetType, string> = {
  board: "자유게시판",
  gallery: "갤러리",
  video: "영상",
  promo: "자유홍보",
  marketplace: "중고거래",
};

export function formatReportDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
