import { SITE_NAME } from "@/lib/seo";
import { siteLegalInfo } from "@/lib/site-legal";

export const feedbackCategories = [
  "bug",
  "suggestion",
  "inquiry",
  "report",
] as const;

export type FeedbackCategory = (typeof feedbackCategories)[number];

export type FeedbackStatus = "pending" | "resolved" | "dismissed";

export type Feedback = {
  id: string;
  category: FeedbackCategory;
  title: string;
  message: string;
  contactEmail: string;
  pageUrl?: string;
  userId?: string;
  nickname: string;
  status: FeedbackStatus;
  adminNote?: string;
  createdAt: string;
  resolvedAt?: string;
};

export type CreateFeedbackInput = {
  category: FeedbackCategory;
  title: string;
  message: string;
  contactEmail: string;
  pageUrl?: string;
  userId?: string;
  nickname: string;
};

export const feedbackCategoryLabels: Record<FeedbackCategory, string> = {
  bug: "버그·오류",
  suggestion: "기능 건의",
  inquiry: "이용 문의",
  report: "신고·불편",
};

export function formatFeedbackDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildFeedbackMailtoUrl(input: {
  category: FeedbackCategory;
  title: string;
  message: string;
  contactEmail?: string;
  pageUrl?: string;
  nickname?: string;
}): string {
  const label = feedbackCategoryLabels[input.category];
  const subject = encodeURIComponent(`[${SITE_NAME} ${label}] ${input.title}`);
  const lines = [
    `분류: ${label}`,
    input.nickname ? `작성자: ${input.nickname}` : "",
    input.contactEmail ? `회신 이메일: ${input.contactEmail}` : "",
    input.pageUrl ? `관련 페이지: ${input.pageUrl}` : "",
    "",
    input.message,
  ].filter(Boolean);

  const body = encodeURIComponent(lines.join("\n"));
  return `mailto:${siteLegalInfo.contactEmail}?subject=${subject}&body=${body}`;
}
