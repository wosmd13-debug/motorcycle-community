"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

type LoginRequiredProps = {
  children: React.ReactNode;
  actionLabel?: string;
};

export default function LoginRequired({
  children,
  actionLabel = "이 기능",
}: LoginRequiredProps) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="portal-panel p-6 text-center text-sm text-stone-500">
        확인 중...
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : pathname || "/"
    );
    return (
      <div className="portal-panel mx-auto max-w-lg p-5 text-center sm:p-6">
        <p className="font-semibold text-stone-800">
          {actionLabel}을(를) 이용하려면 로그인이 필요합니다.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          회원가입 후 본인 닉네임으로 글과 댓글을 남길 수 있습니다.
        </p>
        <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            href={`/login?next=${next}`}
            className="portal-btn min-h-11 px-4 py-2.5 text-sm touch-manipulation"
          >
            로그인
          </Link>
          <Link
            href={`/register?next=${next}`}
            className="inline-flex min-h-11 items-center justify-center border border-signature/30 bg-white px-4 py-2.5 text-sm font-semibold text-signature-dark touch-manipulation hover:bg-signature-light"
          >
            회원가입
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
