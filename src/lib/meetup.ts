export const meetupRegions = [
  "전체",
  "수도권",
  "강원",
  "충남",
  "충북",
  "전남",
  "전북",
  "경남",
  "경북",
  "제주",
] as const;

export type MeetupRegion = Exclude<(typeof meetupRegions)[number], "전체">;

export const meetupPaces = ["여유", "보통", "빠름"] as const;

export type MeetupPace = (typeof meetupPaces)[number];

export const meetupScheduleFilters = [
  { id: "upcoming" as const, label: "예정" },
  { id: "past" as const, label: "지난" },
  { id: "all" as const, label: "전체" },
];

export type MeetupScheduleFilter =
  (typeof meetupScheduleFilters)[number]["id"];

export type MeetupParticipant = {
  userId: string;
  nickname: string;
  joinedAt: string;
};

export type MeetupEntry = {
  id: string;
  title: string;
  author: string;
  authorId: string;
  region: MeetupRegion;
  meetupDate: string;
  meetingPoint: string;
  meetingDetail?: string;
  lat?: number;
  lng?: number;
  pace: MeetupPace;
  routeHint?: string;
  description: string;
  contact?: string;
  maxParticipants?: number | null;
  participants: MeetupParticipant[];
  cancelled: boolean;
  views: number;
  createdAt: string;
};

export type CreateMeetupInput = {
  title: string;
  author: string;
  authorId: string;
  region: MeetupRegion;
  meetupDate: string;
  meetingPoint: string;
  meetingDetail?: string;
  lat?: number;
  lng?: number;
  pace: MeetupPace;
  routeHint?: string;
  description: string;
  contact?: string;
  maxParticipants?: number | null;
};

export type UpdateMeetupInput = Partial<
  Omit<CreateMeetupInput, "author" | "authorId">
> & {
  cancelled?: boolean;
};

export const meetupPaceMeta: Record<
  MeetupPace,
  { label: string; badgeClass: string }
> = {
  여유: {
    label: "여유",
    badgeClass: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  보통: {
    label: "보통",
    badgeClass: "bg-sky-100 text-sky-800 ring-sky-200",
  },
  빠름: {
    label: "빠름",
    badgeClass: "bg-orange-100 text-orange-800 ring-orange-200",
  },
};

export const seedMeetups: MeetupEntry[] = [
  {
    id: "meetup-seed-1",
    title: "팔당 일주 토요일 번개",
    author: "팔당러",
    authorId: "seed-user-1",
    region: "수도권",
    meetupDate: "2026-07-12T07:00:00.000+09:00",
    meetingPoint: "남양주 팔당댐 휴게소",
    meetingDetail: "휴게소 주차장 2층 바이크 주차 구역",
    lat: 37.52,
    lng: 127.372,
    pace: "보통",
    routeHint: "팔당댐 일주",
    description:
      "토요일 아침 7시 팔당 일주 번개입니다. 초보 환영, 중간 휴식은 팔당 라이더 스톱에서 20분 정도 쉬어갑니다.",
    contact: "오픈채팅 링크는 참가 후 공유",
    maxParticipants: 12,
    participants: [
      {
        userId: "seed-user-2",
        nickname: "주말러",
        joinedAt: "2026-07-05T10:00:00.000Z",
      },
      {
        userId: "seed-user-3",
        nickname: "쿼터125",
        joinedAt: "2026-07-06T08:30:00.000Z",
      },
    ],
    cancelled: false,
    views: 84,
    createdAt: "2026-07-04T12:00:00.000Z",
  },
  {
    id: "meetup-seed-2",
    title: "속초→양양 해안 라이딩",
    author: "동해안",
    authorId: "seed-user-4",
    region: "강원",
    meetupDate: "2026-07-19T08:00:00.000+09:00",
    meetingPoint: "속초 중앙시장",
    meetingDetail: "시장 입구 바이크 주차장",
    lat: 38.204,
    lng: 128.59,
    pace: "여유",
    routeHint: "속초·양양 해안",
    description:
      "아침 8시 속초 출발, 양양까지 여유롭게 달립니다. 점심은 양양 서핑비치 라운지 근처에서 각자 해결.",
    maxParticipants: 8,
    participants: [
      {
        userId: "seed-user-1",
        nickname: "팔당러",
        joinedAt: "2026-07-07T14:00:00.000Z",
      },
    ],
    cancelled: false,
    views: 52,
    createdAt: "2026-07-05T09:00:00.000Z",
  },
  {
    id: "meetup-seed-3",
    title: "남해 2박 3일 크루 모집",
    author: "남해크루",
    authorId: "seed-user-5",
    region: "경남",
    meetupDate: "2026-08-02T06:30:00.000+09:00",
    meetingPoint: "마산합포구 라이더 주유소",
    lat: 35.225,
    lng: 128.575,
    pace: "보통",
    routeHint: "남해 해안 일주",
    description:
      "2박 3일 남해 일주 크루 모집입니다. 숙소는 쏠비치 남해 근처 펜션 예약 예정. 장거리 경험 있는 분 환영.",
    contact: "카카오톡 오픈채팅 (참가 후 안내)",
    maxParticipants: 6,
    participants: [],
    cancelled: false,
    views: 31,
    createdAt: "2026-07-06T11:00:00.000Z",
  },
  {
    id: "meetup-seed-4",
    title: "제주 일주 1박 2일",
    author: "제주라이더",
    authorId: "seed-user-6",
    region: "제주",
    meetupDate: "2026-07-26T07:30:00.000+09:00",
    meetingPoint: "제주시 라이더 출발점 카페",
    lat: 33.501,
    lng: 126.528,
    pace: "보통",
    routeHint: "제주 일주",
    description:
      "토요일 아침 제주시 출발, 서쪽 해안→남부→동쪽 순 일주. 1일차 롯데시티호텔 제주 숙박.",
    maxParticipants: 10,
    participants: [
      {
        userId: "seed-user-2",
        nickname: "주말러",
        joinedAt: "2026-07-08T06:00:00.000Z",
      },
      {
        userId: "seed-user-7",
        nickname: "1132러",
        joinedAt: "2026-07-08T12:00:00.000Z",
      },
      {
        userId: "seed-user-8",
        nickname: "제주새",
        joinedAt: "2026-07-09T01:00:00.000Z",
      },
    ],
    cancelled: false,
    views: 67,
    createdAt: "2026-07-07T08:00:00.000Z",
  },
  {
    id: "meetup-seed-5",
    title: "대관령 고랭지 라이딩 (완료)",
    author: "고랭지",
    authorId: "seed-user-9",
    region: "강원",
    meetupDate: "2026-07-05T07:00:00.000+09:00",
    meetingPoint: "강릉 커피거리 라이더점",
    lat: 37.749,
    lng: 128.872,
    pace: "빠름",
    routeHint: "대관령",
    description: "지난 주말 대관령 고랭지 라이딩 모임이었습니다.",
    maxParticipants: 8,
    participants: [
      {
        userId: "seed-user-1",
        nickname: "팔당러",
        joinedAt: "2026-07-03T10:00:00.000Z",
      },
      {
        userId: "seed-user-4",
        nickname: "동해안",
        joinedAt: "2026-07-03T11:00:00.000Z",
      },
      {
        userId: "seed-user-3",
        nickname: "쿼터125",
        joinedAt: "2026-07-04T09:00:00.000Z",
      },
    ],
    cancelled: false,
    views: 41,
    createdAt: "2026-07-01T10:00:00.000Z",
  },
];

export function normalizeMeetup(entry: MeetupEntry): MeetupEntry {
  return {
    ...entry,
    participants: entry.participants ?? [],
    maxParticipants: entry.maxParticipants ?? null,
    cancelled: entry.cancelled ?? false,
    views: entry.views ?? 0,
  };
}

export function getMeetupParticipantCount(entry: MeetupEntry): number {
  return entry.participants.length;
}

export function isMeetupFull(entry: MeetupEntry): boolean {
  if (entry.cancelled) return true;
  if (entry.maxParticipants == null) return false;
  return entry.participants.length >= entry.maxParticipants;
}

export function isMeetupPast(entry: MeetupEntry, now = new Date()): boolean {
  return new Date(entry.meetupDate).getTime() < now.getTime();
}

export function isUserJoined(entry: MeetupEntry, userId: string): boolean {
  return entry.participants.some((participant) => participant.userId === userId);
}

export function canJoinMeetup(
  entry: MeetupEntry,
  userId: string,
  now = new Date()
): boolean {
  if (entry.cancelled || isMeetupPast(entry, now) || isMeetupFull(entry)) {
    return false;
  }
  return !isUserJoined(entry, userId);
}

export function canLeaveMeetup(
  entry: MeetupEntry,
  userId: string,
  now = new Date()
): boolean {
  if (entry.cancelled || isMeetupPast(entry, now)) return false;
  return isUserJoined(entry, userId);
}

export function canManageMeetup(
  user:
    | {
        id: string;
        isAdmin?: boolean;
        isOperator?: boolean;
      }
    | null
    | undefined,
  entry: MeetupEntry
): boolean {
  if (!user) return false;
  if (user.isAdmin || user.isOperator) return true;
  return entry.authorId === user.id;
}

export function formatMeetupDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatMeetupDateShort(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function getMeetupDday(value: string, now = new Date()): string | null {
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTarget = new Date(target);
  startOfTarget.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return null;
  if (diffDays === 0) return "D-Day";
  return `D-${diffDays}`;
}

export function getMeetupStatusLabel(
  entry: MeetupEntry,
  now = new Date()
): string {
  if (entry.cancelled) return "취소됨";
  if (isMeetupPast(entry, now)) return "종료";
  if (isMeetupFull(entry)) return "마감";
  return "모집중";
}

export function getMeetupStatusClass(
  entry: MeetupEntry,
  now = new Date()
): string {
  if (entry.cancelled) return "bg-stone-100 text-stone-600 ring-stone-200";
  if (isMeetupPast(entry, now)) return "bg-stone-100 text-stone-500 ring-stone-200";
  if (isMeetupFull(entry)) return "bg-amber-100 text-amber-800 ring-amber-200";
  return "bg-signature-light text-signature-darker ring-signature/30";
}

export function filterMeetups({
  entries,
  region,
  schedule,
  query,
}: {
  entries: MeetupEntry[];
  region: (typeof meetupRegions)[number];
  schedule: MeetupScheduleFilter;
  query: string;
}): MeetupEntry[] {
  const normalizedQuery = query.trim().toLowerCase();
  const now = new Date();

  return entries
    .filter((entry) => {
      if (region !== "전체" && entry.region !== region) return false;

      const past = isMeetupPast(entry, now);
      if (schedule === "upcoming" && past) return false;
      if (schedule === "past" && !past) return false;

      if (!normalizedQuery) return true;

      const haystack = [
        entry.title,
        entry.description,
        entry.meetingPoint,
        entry.meetingDetail ?? "",
        entry.routeHint ?? "",
        entry.region,
        entry.author,
        entry.contact ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    })
    .sort((a, b) => {
      const aTime = new Date(a.meetupDate).getTime();
      const bTime = new Date(b.meetupDate).getTime();
      const upcoming = schedule !== "past";
      return upcoming ? aTime - bTime : bTime - aTime;
    });
}

export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTime() - date.getTimezoneOffset() * 60_000;
  return new Date(offset).toISOString().slice(0, 16);
}
