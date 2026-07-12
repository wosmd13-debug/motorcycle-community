import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import {
  MEMBER_GRADES,
  OPERATOR_GRADE,
  type MemberGrade,
  type MemberRankEntry,
} from "@/lib/ranking";

type MemberGradeBadgeProps = {
  grade: MemberGrade;
  size?: "sm" | "md";
};

export default function MemberGradeBadge({
  grade,
  size = "sm",
}: MemberGradeBadgeProps) {
  const sizeClass =
    size === "md"
      ? "px-2.5 py-1 text-xs"
      : "px-2 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border font-bold ${sizeClass} ${grade.badgeClass}`}
    >
      {grade.label}
    </span>
  );
}

export function MemberGradeLegend({
  showOperatorGrade = false,
}: {
  showOperatorGrade?: boolean;
}) {
  return (
    <div className="space-y-3">
      {showOperatorGrade && (
        <div className="rounded border border-red-200 bg-red-50/60 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <MemberGradeBadge grade={OPERATOR_GRADE} />
            <span className="text-xs font-semibold text-red-700">
              사이트 운영자 전용
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-5 text-red-700/80">
            {OPERATOR_GRADE.description} (ADMIN_LOGIN_IDS에 등록된 계정)
          </p>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {MEMBER_GRADES.map((grade) => (
          <div
            key={grade.id}
            className="rounded border border-signature/10 bg-white px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <MemberGradeBadge grade={grade} />
              {grade.requirements ? (
                <span className="text-xs font-semibold text-stone-600">
                  조건 충족
                </span>
              ) : (
                <span className="text-xs font-semibold text-stone-600">
                  시작 등급
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[11px] leading-5 text-stone-500">
              {grade.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MemberRankRow({
  entry,
  highlight = false,
}: {
  entry: MemberRankEntry;
  highlight?: boolean;
}) {
  const rankClass =
    entry.rank === 1
      ? "bg-signature text-white"
      : entry.rank === 2
        ? "bg-signature/80 text-white"
        : entry.rank === 3
          ? "bg-signature/60 text-white"
          : "bg-stone-100 text-stone-400";

  return (
    <tr
      className={
        highlight
          ? "bg-signature-light/60"
          : "transition hover:bg-signature-light/30"
      }
    >
      <td className="px-4 py-3">
        <span
          className={`inline-flex h-6 w-6 items-center justify-center text-xs font-bold ${rankClass}`}
        >
          {entry.rank}
        </span>
      </td>
      <td className="px-4 py-3">
        <AuthorWithGrade
          author={entry.nickname}
          authorGradeId={entry.grade.id}
          nicknameClassName="font-semibold text-stone-800"
          className="inline-flex max-w-full flex-wrap items-center gap-1"
        />
      </td>
      <td className="hidden px-4 py-3 text-sm text-stone-600 sm:table-cell">
        {entry.activity.posts}
      </td>
      <td className="hidden px-4 py-3 text-sm text-stone-600 md:table-cell">
        {entry.activity.comments}
      </td>
      <td className="hidden px-4 py-3 text-sm text-stone-600 lg:table-cell">
        {entry.activity.likesReceived}
      </td>
      <td className="px-4 py-3 text-right text-sm font-bold text-signature-dark">
        {entry.points.toLocaleString("ko-KR")}P
      </td>
    </tr>
  );
}
