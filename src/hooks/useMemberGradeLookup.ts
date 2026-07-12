"use client";

import { useEffect, useMemo, useState } from "react";
import { collectNicknamesNeedingGradeLookup } from "@/lib/member-grade-display";
import type { MemberGradeId } from "@/lib/ranking";

export function useMemberGradeLookup(
  sources: Array<{ author: string; authorGradeId?: MemberGradeId }>
) {
  const nicknames = useMemo(
    () => collectNicknamesNeedingGradeLookup(sources),
    [sources]
  );
  const nicknameKey = useMemo(() => nicknames.join("\0"), [nicknames]);
  const [gradesByNickname, setGradesByNickname] = useState<
    Record<string, MemberGradeId>
  >({});

  useEffect(() => {
    if (nicknames.length === 0) return;

    let cancelled = false;

    void fetch("/api/ranking/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nicknames }),
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const data = (await response.json()) as {
          gradesByNickname?: Record<string, MemberGradeId>;
        };
        return data.gradesByNickname ?? null;
      })
      .then((nextGrades) => {
        if (!nextGrades || cancelled) return;
        setGradesByNickname((current) => ({ ...current, ...nextGrades }));
      });

    return () => {
      cancelled = true;
    };
  }, [nicknameKey, nicknames]);

  return gradesByNickname;
}
