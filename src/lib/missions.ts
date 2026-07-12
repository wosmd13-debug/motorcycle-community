export type MissionPeriod = "daily" | "weekly";

export type MissionId =
  | "daily_checkin"
  | "daily_comment"
  | "daily_board"
  | "daily_gallery"
  | "daily_like"
  | "daily_clear"
  | "weekly_posts"
  | "weekly_comments"
  | "weekly_gallery"
  | "weekly_streak"
  | "weekly_clear";

export type MissionDefinition = {
  id: MissionId;
  period: MissionPeriod;
  title: string;
  description: string;
  hint: string;
  points: number;
  target: number;
  href?: string;
  cta?: string;
  icon: string;
  accent: string;
  /** 출석처럼 버튼 한 번으로 완료 */
  action?: "checkin";
};

export const DAILY_MISSIONS: MissionDefinition[] = [
  {
    id: "daily_checkin",
    period: "daily",
    title: "라이딩 출석",
    description: "오늘도 커뮤니티에 들렀다는 인증",
    hint: "출석 도장을 찍으면 바로 포인트가 쌓입니다",
    points: 15,
    target: 1,
    icon: "출",
    accent: "from-orange-500 to-amber-400",
    action: "checkin",
    cta: "출석 체크",
  },
  {
    id: "daily_comment",
    period: "daily",
    title: "한마디 남기기",
    description: "게시글·갤러리·영상에 댓글 1개",
    hint: "짧은 응원·질문도 미션 완료",
    points: 20,
    target: 1,
    href: "/board",
    cta: "게시판 가기",
    icon: "댓",
    accent: "from-sky-500 to-cyan-400",
  },
  {
    id: "daily_board",
    period: "daily",
    title: "오늘의 글쓰기",
    description: "자유게시판에 글 1개 등록",
    hint: "일상·질문·코스 후기 모두 OK",
    points: 35,
    target: 1,
    href: "/board",
    cta: "글쓰러 가기",
    icon: "글",
    accent: "from-signature-dark to-emerald-400",
  },
  {
    id: "daily_gallery",
    period: "daily",
    title: "인증샷 한 장",
    description: "갤러리에 사진 1장 올리기",
    hint: "바이크·풍경·크루 사진 환영",
    points: 30,
    target: 1,
    href: "/gallery",
    cta: "갤러리 가기",
    icon: "샷",
    accent: "from-violet-500 to-fuchsia-400",
  },
  {
    id: "daily_like",
    period: "daily",
    title: "응원 하트",
    description: "게시글·갤러리·영상에 좋아요 3회",
    hint: "좋은 콘텐츠에 하트를 눌러 주세요",
    points: 18,
    target: 3,
    href: "/gallery",
    cta: "둘러보기",
    icon: "하",
    accent: "from-rose-500 to-pink-400",
  },
  {
    id: "daily_clear",
    period: "daily",
    title: "데일리 올클리어",
    description: "오늘 일일 미션 전부 완료",
    hint: "출석·댓글·글·사진·좋아요까지 끝낸 라이더 보너스",
    points: 50,
    target: 1,
    icon: "클",
    accent: "from-amber-500 to-yellow-300",
  },
];

export const WEEKLY_MISSIONS: MissionDefinition[] = [
  {
    id: "weekly_posts",
    period: "weekly",
    title: "주간 라이더 로그",
    description: "이번 주 게시글·홍보·영상·카페 글 3개",
    hint: "어떤 카테고리든 합산됩니다",
    points: 80,
    target: 3,
    href: "/board",
    cta: "글 쓰러 가기",
    icon: "로",
    accent: "from-emerald-600 to-lime-400",
  },
  {
    id: "weekly_comments",
    period: "weekly",
    title: "소통 레이스",
    description: "이번 주 댓글 10개",
    hint: "꾸준한 댓글이 커뮤니티를 살립니다",
    points: 70,
    target: 10,
    href: "/board",
    cta: "댓글 달러 가기",
    icon: "소",
    accent: "from-blue-600 to-sky-400",
  },
  {
    id: "weekly_gallery",
    period: "weekly",
    title: "주간 포토 챌린지",
    description: "이번 주 갤러리 사진 2장",
    hint: "라이딩 인증샷을 모아보세요",
    points: 75,
    target: 2,
    href: "/gallery",
    cta: "사진 올리기",
    icon: "포",
    accent: "from-purple-600 to-pink-400",
  },
  {
    id: "weekly_streak",
    period: "weekly",
    title: "연속 출석 5일",
    description: "이번 주 출석 체크 5일 달성",
    hint: "매일 출석하면 스트릭이 이어집니다",
    points: 100,
    target: 5,
    href: "/missions",
    cta: "출석하러 가기",
    icon: "연",
    accent: "from-orange-600 to-red-400",
  },
  {
    id: "weekly_clear",
    period: "weekly",
    title: "위클리 챔피언",
    description: "이번 주 주간 미션 전부 완료",
    hint: "주간 미션을 모두 깨면 챔피언 보너스",
    points: 120,
    target: 1,
    icon: "챔",
    accent: "from-yellow-500 to-orange-400",
  },
];

export const ALL_MISSIONS: MissionDefinition[] = [
  ...DAILY_MISSIONS,
  ...WEEKLY_MISSIONS,
];

export function getMissionDefinition(id: MissionId): MissionDefinition | undefined {
  return ALL_MISSIONS.find((mission) => mission.id === id);
}

export type MissionClaim = {
  id: string;
  userId: string;
  missionId: MissionId;
  periodKey: string;
  points: number;
  claimedAt: string;
};

export type MissionCheckIn = {
  userId: string;
  dateKey: string;
  createdAt: string;
};

export type MissionsFileData = {
  claims: MissionClaim[];
  checkIns: MissionCheckIn[];
  likeEvents: MissionLikeEvent[];
};

export type MissionLikeEvent = {
  id: string;
  userId: string;
  createdAt: string;
};

export type MissionProgressView = {
  definition: MissionDefinition;
  periodKey: string;
  current: number;
  target: number;
  percent: number;
  completed: boolean;
  claimed: boolean;
  claimable: boolean;
  locked?: boolean;
  lockReason?: string;
};

export type MissionWeekDay = {
  dateKey: string;
  weekday: string;
  checked: boolean;
  isToday: boolean;
};

export type MissionDashboard = {
  dateKey: string;
  weekKey: string;
  weekLabel: string;
  streak: number;
  longestStreak: number;
  todayCheckedIn: boolean;
  weekDays: MissionWeekDay[];
  daily: MissionProgressView[];
  weekly: MissionProgressView[];
  dailyCompletedCount: number;
  weeklyCompletedCount: number;
  dailyClaimablePoints: number;
  weeklyClaimablePoints: number;
  totalEarnedPoints: number;
  endsAt: {
    daily: string;
    weekly: string;
  };
};

/** Asia/Seoul 기준 YYYY-MM-DD */
export function getSeoulDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getSeoulWeekKey(date = new Date()): string {
  const parts = getSeoulDateParts(date);
  const utc = Date.UTC(parts.year, parts.month - 1, parts.day);
  const day = new Date(utc);
  const dayNum = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((day.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${day.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function getSeoulWeekLabel(date = new Date()): string {
  const key = getSeoulWeekKey(date);
  const [, week] = key.split("-W");
  const parts = getSeoulDateParts(date);
  return `${parts.year}년 ${Number(week)}주차`;
}

function getSeoulDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const chunks = formatter.formatToParts(date);
  const year = Number(chunks.find((part) => part.type === "year")?.value);
  const month = Number(chunks.find((part) => part.type === "month")?.value);
  const day = Number(chunks.find((part) => part.type === "day")?.value);
  return { year, month, day };
}

export function getSeoulDayBounds(dateKey: string): { start: Date; end: Date } {
  const start = new Date(`${dateKey}T00:00:00+09:00`);
  const end = new Date(`${dateKey}T23:59:59.999+09:00`);
  return { start, end };
}

export function getSeoulWeekBounds(date = new Date()): {
  start: Date;
  end: Date;
  dateKeys: string[];
} {
  const parts = getSeoulDateParts(date);
  const base = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const dayNum = base.getUTCDay() || 7;
  const monday = new Date(base);
  monday.setUTCDate(base.getUTCDate() - dayNum + 1);

  const dateKeys: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const cursor = new Date(monday);
    cursor.setUTCDate(monday.getUTCDate() + i);
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    const d = String(cursor.getUTCDate()).padStart(2, "0");
    dateKeys.push(`${y}-${m}-${d}`);
  }

  return {
    start: new Date(`${dateKeys[0]}T00:00:00+09:00`),
    end: new Date(`${dateKeys[6]}T23:59:59.999+09:00`),
    dateKeys,
  };
}

export function getNextSeoulMidnightIso(date = new Date()): string {
  const dateKey = getSeoulDateKey(date);
  const next = new Date(`${dateKey}T00:00:00+09:00`);
  next.setDate(next.getDate() + 1);
  return next.toISOString();
}

export function getNextSeoulWeekStartIso(date = new Date()): string {
  const { dateKeys } = getSeoulWeekBounds(date);
  const nextMonday = new Date(`${dateKeys[6]}T00:00:00+09:00`);
  nextMonday.setDate(nextMonday.getDate() + 1);
  return nextMonday.toISOString();
}

export function calcStreak(
  checkIns: MissionCheckIn[],
  userId: string,
  todayKey = getSeoulDateKey()
): { current: number; longest: number; todayCheckedIn: boolean } {
  const dates = new Set(
    checkIns.filter((item) => item.userId === userId).map((item) => item.dateKey)
  );
  const todayCheckedIn = dates.has(todayKey);

  let current = 0;
  let cursor = todayKey;
  if (!todayCheckedIn) {
    cursor = shiftDateKey(todayKey, -1);
  }

  while (dates.has(cursor)) {
    current += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  const sorted = [...dates].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of sorted) {
    if (prev && shiftDateKey(prev, 1) === key) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = key;
  }

  return { current, longest, todayCheckedIn };
}

export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const date = new Date(`${dateKey}T12:00:00+09:00`);
  date.setDate(date.getDate() + deltaDays);
  return getSeoulDateKey(date);
}

export function periodKeyForMission(
  mission: MissionDefinition,
  date = new Date()
): string {
  return mission.period === "daily" ? getSeoulDateKey(date) : getSeoulWeekKey(date);
}
