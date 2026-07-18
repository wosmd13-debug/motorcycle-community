"use client";

import { useEffect, useMemo, useState } from "react";
import type { ShopCosmeticLook } from "@/lib/shop";
import {
  ensureCosmeticLooks,
  getCachedCosmeticLooks,
  subscribeCosmeticLooks,
} from "@/hooks/cosmetic-look-cache";

export function useCosmeticLookup(nicknames: string[]) {
  const unique = useMemo(() => {
    const set = new Set(nicknames.filter(Boolean));
    return [...set].sort();
  }, [nicknames]);
  const key = useMemo(() => unique.join("\0"), [unique]);
  const [looksByNickname, setLooksByNickname] = useState<
    Record<string, ShopCosmeticLook>
  >(() => getCachedCosmeticLooks(unique));

  useEffect(() => {
    if (unique.length === 0) return;

    ensureCosmeticLooks(unique);
    setLooksByNickname(getCachedCosmeticLooks(unique));

    return subscribeCosmeticLooks(() => {
      ensureCosmeticLooks(unique);
      setLooksByNickname(getCachedCosmeticLooks(unique));
    });
  }, [key, unique]);

  return looksByNickname;
}

/** 단일 닉네임 코스메틱 — AuthorWithGrade 자동 조회용 */
export function useAuthorCosmeticLook(
  author: string,
  enabled = true
): ShopCosmeticLook | undefined {
  const nicknames = useMemo(
    () => (enabled && author ? [author] : []),
    [author, enabled]
  );
  const looks = useCosmeticLookup(nicknames);
  if (!enabled || !author) return undefined;
  return looks[author];
}
