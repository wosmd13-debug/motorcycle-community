export type MemberGradeId =
  | "beginner"
  | "quarter"
  | "middle"
  | "liter"
  | "hyper"
  | "operator";

export type GradeRequirements = {
  posts: number;
  comments: number;
  likesReceived: number;
  viewsReceived: number;
};

export type MemberGrade = {
  id: MemberGradeId;
  label: string;
  badgeClass: string;
  textClass: string;
  description: string;
  requirements: GradeRequirements | null;
};

/** 사이트 운영자(ADMIN_LOGIN_IDS) 전용 등급 */
export const OPERATOR_GRADE: MemberGrade = {
  id: "operator",
  label: "운영진",
  badgeClass: "bg-red-50 text-red-700 border-red-200",
  textClass: "text-red-700",
  description: "사이트 운영자 전용 등급",
  requirements: null,
};

export const MEMBER_GRADES: MemberGrade[] = [
  {
    id: "beginner",
    label: "입문",
    badgeClass: "bg-stone-100 text-stone-600 border-stone-200",
    textClass: "text-stone-600",
    description: "가입한 모두가 첫 시작하는 등급",
    requirements: null,
  },
  {
    id: "quarter",
    label: "쿼터",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    textClass: "text-emerald-700",
    description: "게시글 10개, 댓글 20개, 좋아요 30개, 조회 30회",
    requirements: {
      posts: 10,
      comments: 20,
      likesReceived: 30,
      viewsReceived: 30,
    },
  },
  {
    id: "middle",
    label: "미들",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    textClass: "text-sky-700",
    description: "게시글 50개, 댓글 100개, 좋아요 50개, 조회 50회",
    requirements: {
      posts: 50,
      comments: 100,
      likesReceived: 50,
      viewsReceived: 50,
    },
  },
  {
    id: "liter",
    label: "리터",
    badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
    textClass: "text-violet-700",
    description: "게시글 200개, 댓글 200개, 좋아요 200개, 조회 200회",
    requirements: {
      posts: 200,
      comments: 200,
      likesReceived: 200,
      viewsReceived: 200,
    },
  },
  {
    id: "hyper",
    label: "하이퍼",
    badgeClass: "bg-signature-light text-signature-dark border-signature/30",
    textClass: "text-signature-dark",
    description: "게시글 500개, 댓글 500개, 좋아요 500개, 조회 1000회",
    requirements: {
      posts: 500,
      comments: 500,
      likesReceived: 500,
      viewsReceived: 1000,
    },
  },
];

export const RANKING_POINTS = {
  signup: 10,
  boardPost: 20,
  promoPost: 15,
  galleryPost: 15,
  videoPost: 25,
  cafePost: 30,
  comment: 8,
  commentUpvote: 3,
  postLike: 2,
  postViewPerTen: 1,
  commentOnPost: 5,
  /** 미션 보상은 mission-store claims 합산으로 반영 */
} as const;

export type MemberRankBreakdown = {
  signup: number;
  posts: number;
  comments: number;
  engagement: number;
  missions: number;
  /** 상점 사용으로 차감된 포인트 */
  shopSpend: number;
};

export type MemberRankActivity = {
  posts: number;
  comments: number;
  likesReceived: number;
  viewsReceived: number;
};

export type MemberRankEntry = {
  userId: string;
  loginId: string;
  nickname: string;
  points: number;
  rank: number;
  grade: MemberGrade;
  activity: MemberRankActivity;
  breakdown: MemberRankBreakdown;
  joinedAt: string;
};

export function meetsGradeRequirements(
  activity: MemberRankActivity,
  requirements: GradeRequirements
): boolean {
  return (
    activity.posts >= requirements.posts &&
    activity.comments >= requirements.comments &&
    activity.likesReceived >= requirements.likesReceived &&
    activity.viewsReceived >= requirements.viewsReceived
  );
}

export function getGradeForActivity(activity: MemberRankActivity): MemberGrade {
  for (let index = MEMBER_GRADES.length - 1; index >= 0; index -= 1) {
    const grade = MEMBER_GRADES[index];
    if (!grade.requirements) continue;
    if (meetsGradeRequirements(activity, grade.requirements)) {
      return grade;
    }
  }
  return MEMBER_GRADES[0];
}

export function getNextGrade(current: MemberGrade): MemberGrade | null {
  if (current.id === "operator") return null;
  const index = MEMBER_GRADES.findIndex((grade) => grade.id === current.id);
  if (index === -1 || index >= MEMBER_GRADES.length - 1) return null;
  return MEMBER_GRADES[index + 1];
}

export function getGradeProgressMessage(
  activity: MemberRankActivity,
  currentGrade?: MemberGrade
): string | null {
  const current = currentGrade ?? getGradeForActivity(activity);
  if (current.id === "operator") return null;

  const next = getNextGrade(current);
  if (!next?.requirements) return null;

  const remaining: string[] = [];
  const { requirements } = next;

  if (activity.posts < requirements.posts) {
    remaining.push(`게시글 ${requirements.posts - activity.posts}개`);
  }
  if (activity.comments < requirements.comments) {
    remaining.push(`댓글 ${requirements.comments - activity.comments}개`);
  }
  if (activity.likesReceived < requirements.likesReceived) {
    remaining.push(`좋아요 ${requirements.likesReceived - activity.likesReceived}개`);
  }
  if (activity.viewsReceived < requirements.viewsReceived) {
    remaining.push(`조회 ${requirements.viewsReceived - activity.viewsReceived}회`);
  }

  if (remaining.length === 0) return null;
  return `다음 등급(${next.label})까지 ${remaining.join(", ")} 더 필요`;
}

export function formatGradeRequirements(requirements: GradeRequirements): string {
  return `게시글 ${requirements.posts.toLocaleString("ko-KR")}개, 댓글 ${requirements.comments.toLocaleString("ko-KR")}개, 좋아요 ${requirements.likesReceived.toLocaleString("ko-KR")}개, 조회 ${requirements.viewsReceived.toLocaleString("ko-KR")}회`;
}

export function formatRankPoints(points: number): string {
  return points.toLocaleString("ko-KR");
}
