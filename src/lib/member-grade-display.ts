import {
  MEMBER_GRADES,
  OPERATOR_GRADE,
  type MemberGrade,
  type MemberGradeId,
} from "@/lib/ranking";

export type AuthorGradeSource = {
  author: string;
  authorGradeId?: MemberGradeId;
};

export function resolveMemberGrade(
  source: AuthorGradeSource,
  gradesByNickname?: Record<string, MemberGradeId>
): MemberGrade {
  if (
    source.authorGradeId === "operator" ||
    source.author === "운영자"
  ) {
    return OPERATOR_GRADE;
  }

  const gradeId =
    source.authorGradeId ?? gradesByNickname?.[source.author] ?? "beginner";

  return (
    MEMBER_GRADES.find((grade) => grade.id === gradeId) ?? MEMBER_GRADES[0]
  );
}

export function collectNicknamesNeedingGradeLookup(
  sources: AuthorGradeSource[]
): string[] {
  return Array.from(
    new Set(
      sources
        .filter(
          (source) =>
            Boolean(source.author) &&
            source.author !== "운영자" &&
            source.authorGradeId !== "operator" &&
            !source.authorGradeId
        )
        .map((source) => source.author)
    )
  );
}

export function collectAuthorGradeSources(
  posts: Array<{
    author: string;
    authorGradeId?: MemberGradeId;
    comments?: AuthorGradeSource[];
  }>
): AuthorGradeSource[] {
  const sources: AuthorGradeSource[] = [];

  for (const post of posts) {
    sources.push({
      author: post.author,
      authorGradeId: post.authorGradeId,
    });

    for (const comment of post.comments ?? []) {
      sources.push(comment);
    }
  }

  return sources;
}

/** @deprecated Use collectAuthorGradeSources */
export const collectBoardGradeSources = collectAuthorGradeSources;
