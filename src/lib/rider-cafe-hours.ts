export const WEEK_DAYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export type WeekDay = (typeof WEEK_DAYS)[number];

export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
  sun: "일",
};

export type DayOpenHours = {
  closed: boolean;
  open: string;
  close: string;
};

export type WeeklyOpenHours = Record<WeekDay, DayOpenHours>;

const DEFAULT_OPEN = "09:00";
const DEFAULT_CLOSE = "18:00";

export function createDayOpenHours(
  overrides: Partial<DayOpenHours> = {}
): DayOpenHours {
  return {
    closed: overrides.closed ?? false,
    open: overrides.open ?? DEFAULT_OPEN,
    close: overrides.close ?? DEFAULT_CLOSE,
  };
}

export function emptyWeeklyOpenHours(
  open = DEFAULT_OPEN,
  close = DEFAULT_CLOSE
): WeeklyOpenHours {
  return WEEK_DAYS.reduce((acc, day) => {
    acc[day] = createDayOpenHours({ open, close });
    return acc;
  }, {} as WeeklyOpenHours);
}

export function normalizeWeeklyOpenHours(
  input: Partial<WeeklyOpenHours> | null | undefined
): WeeklyOpenHours | undefined {
  if (!input) return undefined;

  const normalized = emptyWeeklyOpenHours();
  let hasAny = false;

  for (const day of WEEK_DAYS) {
    const value = input[day];
    if (!value) continue;

    normalized[day] = {
      closed: Boolean(value.closed),
      open: String(value.open ?? DEFAULT_OPEN).trim() || DEFAULT_OPEN,
      close: String(value.close ?? DEFAULT_CLOSE).trim() || DEFAULT_CLOSE,
    };
    hasAny = true;
  }

  return hasAny ? normalized : undefined;
}

const CLOSED_DAY_KEYWORDS: Partial<Record<WeekDay, string[]>> = {
  mon: ["월요일", "월"],
  tue: ["화요일", "화"],
  wed: ["수요일", "수"],
  thu: ["목요일", "목"],
  fri: ["금요일", "금"],
  sat: ["토요일", "토"],
  sun: ["일요일", "일"],
};

function parseTimeRange(text: string): { open: string; close: string } | null {
  const match = text.match(/(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/);
  if (!match) return null;
  return { open: match[1], close: match[2] };
}

function detectClosedDays(closedDays?: string): Set<WeekDay> {
  const closed = new Set<WeekDay>();
  if (!closedDays) return closed;

  for (const day of WEEK_DAYS) {
    const keywords = CLOSED_DAY_KEYWORDS[day] ?? [];
    if (keywords.some((keyword) => closedDays.includes(keyword))) {
      closed.add(day);
    }
  }

  return closed;
}

export function migrateLegacyOpenHours(
  openHours?: string,
  closedDays?: string
): WeeklyOpenHours | undefined {
  if (!openHours?.trim()) return undefined;

  const range = parseTimeRange(openHours) ?? {
    open: DEFAULT_OPEN,
    close: DEFAULT_CLOSE,
  };
  const closedSet = detectClosedDays(closedDays);

  return WEEK_DAYS.reduce((acc, day) => {
    acc[day] = closedSet.has(day)
      ? createDayOpenHours({ closed: true, open: range.open, close: range.close })
      : createDayOpenHours({ open: range.open, close: range.close });
    return acc;
  }, {} as WeeklyOpenHours);
}

export function formatDayOpenHours(day: DayOpenHours): string {
  if (day.closed) return "휴무";
  return `${day.open} - ${day.close}`;
}

export function formatWeeklyOpenHoursSummary(
  hours: WeeklyOpenHours | undefined
): string | null {
  if (!hours) return null;

  const groups = new Map<string, WeekDay[]>();

  for (const day of WEEK_DAYS) {
    const label = formatDayOpenHours(hours[day]);
    const existing = groups.get(label) ?? [];
    existing.push(day);
    groups.set(label, existing);
  }

  const parts = [...groups.entries()].map(([label, days]) => {
    if (days.length === 7) return `매일 ${label}`;
    const dayText = formatDayRangeLabel(days);
    return `${dayText} ${label}`;
  });

  return parts.join(" · ");
}

function formatDayRangeLabel(days: WeekDay[]): string {
  if (days.length === 1) return WEEK_DAY_LABELS[days[0]];

  const indices = days
    .map((day) => WEEK_DAYS.indexOf(day))
    .sort((a, b) => a - b);

  const isContiguous = indices.every(
    (index, i) => i === 0 || index === indices[i - 1] + 1
  );

  if (isContiguous && days.length > 1) {
    return `${WEEK_DAY_LABELS[days[0]]}-${WEEK_DAY_LABELS[days[days.length - 1]]}`;
  }

  return days.map((day) => WEEK_DAY_LABELS[day]).join(",");
}

export function getTodayWeekDay(): WeekDay {
  const jsDay = new Date().getDay();
  const map: WeekDay[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[jsDay];
}

export function formatTodayOpenHours(
  hours: WeeklyOpenHours | undefined
): string | null {
  if (!hours) return null;
  const today = getTodayWeekDay();
  const label = formatDayOpenHours(hours[today]);
  return `오늘(${WEEK_DAY_LABELS[today]}) ${label}`;
}

export function weeklyHoursToSearchText(hours: WeeklyOpenHours | undefined): string {
  if (!hours) return "";
  return WEEK_DAYS.map(
    (day) => `${WEEK_DAY_LABELS[day]} ${formatDayOpenHours(hours[day])}`
  ).join(" ");
}

export function hasWeeklyOpenHours(hours: WeeklyOpenHours | undefined): boolean {
  return Boolean(hours);
}

export function parseWeeklyOpenHoursFromBody(
  body: Record<string, unknown>
): WeeklyOpenHours | undefined {
  const raw = body.weeklyHours;
  if (!raw || typeof raw !== "object") return undefined;
  return normalizeWeeklyOpenHours(raw as Partial<WeeklyOpenHours>);
}

export function applyWeeklyHoursToAllDays(
  hours: WeeklyOpenHours,
  sourceDay: WeekDay
): WeeklyOpenHours {
  const source = hours[sourceDay];
  return WEEK_DAYS.reduce((acc, day) => {
    acc[day] = { ...source };
    return acc;
  }, {} as WeeklyOpenHours);
}
