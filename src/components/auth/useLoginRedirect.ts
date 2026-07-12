"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

/** open-redirect 방지: 사이트 내부 경로만 허용 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) {
    return "/";
  }
  return raw;
}

export function useLoginRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  return (customNext?: string) => {
    if (user) return true;

    const fallback =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : pathname || "/";
    const next = safeNextPath(customNext ?? fallback);
    router.push(`/login?next=${encodeURIComponent(next)}`);
    return false;
  };
}
