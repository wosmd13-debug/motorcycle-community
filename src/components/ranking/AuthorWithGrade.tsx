"use client";

import MemberGradeBadge from "@/components/ranking/MemberGradeBadge";
import { useAuthorCosmeticLook } from "@/hooks/useCosmeticLookup";
import { resolveMemberGrade } from "@/lib/member-grade-display";
import type { MemberGradeId } from "@/lib/ranking";
import type { ShopCosmeticLook } from "@/lib/shop";

type AuthorWithGradeProps = {
  author: string;
  authorGradeId?: MemberGradeId;
  gradesByNickname?: Record<string, MemberGradeId>;
  cosmeticLook?: ShopCosmeticLook | null;
  looksByNickname?: Record<string, ShopCosmeticLook>;
  /** false면 자동 코스메틱 조회 생략 (서버에서 looks를 넘긴 경우 등) */
  autoCosmetic?: boolean;
  nicknameClassName?: string;
  className?: string;
  badgeSize?: "sm" | "md";
  /** 등급 뱃지 숨김 (프레임·칭호만 표시) */
  hideGrade?: boolean;
};

/** 작성자 닉네임 + 등급 + 상점 코스메틱(색상·프레임·칭호) */
export default function AuthorWithGrade({
  author,
  authorGradeId,
  gradesByNickname,
  cosmeticLook,
  looksByNickname,
  autoCosmetic = true,
  nicknameClassName = "truncate font-semibold text-stone-800",
  className = "inline-flex min-w-0 max-w-full flex-nowrap items-center gap-1.5",
  badgeSize = "sm",
  hideGrade = false,
}: AuthorWithGradeProps) {
  const grade = resolveMemberGrade(
    { author, authorGradeId },
    gradesByNickname
  );
  const hasMapEntry =
    looksByNickname != null && Object.prototype.hasOwnProperty.call(looksByNickname, author);
  const needsAuto =
    autoCosmetic && cosmeticLook == null && !hasMapEntry;
  const autoLook = useAuthorCosmeticLook(author, needsAuto);
  const look =
    cosmeticLook ?? (hasMapEntry ? looksByNickname![author] : undefined) ?? autoLook ?? {};
  const nameClass = look.nicknameClassName
    ? ["shop-author-name", look.nicknameClassName].join(" ")
    : ["shop-author-name", nicknameClassName].filter(Boolean).join(" ");
  const showGrade =
    !hideGrade &&
    (Boolean(authorGradeId) ||
      gradesByNickname?.[author] != null ||
      author === "운영자");

  return (
    <span className={`shop-author ${className}`}>
      <span
        className={
          look.frameClassName
            ? `shop-author-frame inline-flex min-w-0 shrink items-center overflow-hidden ${look.frameClassName}`
            : "shop-author-frame inline-flex min-w-0 shrink items-center overflow-hidden"
        }
      >
        <span className={nameClass}>{author}</span>
      </span>
      {look.titleBadge ? (
        <span
          className={
            look.titleBadgeClassName
              ? `shrink-0 ${look.titleBadgeClassName}`
              : "shop-title-badge shrink-0"
          }
        >
          {look.titleBadge}
        </span>
      ) : null}
      {showGrade ? <MemberGradeBadge grade={grade} size={badgeSize} /> : null}
    </span>
  );
}
