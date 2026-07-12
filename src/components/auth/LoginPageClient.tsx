"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { safeNextPath } from "@/components/auth/useLoginRedirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nextPath = safeNextPath(searchParams.get("next"));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const message = await login(loginId, password);
    if (message) {
      setError(message);
      setSubmitting(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="portal-panel mx-auto w-full max-w-md space-y-4 p-5 sm:p-6">
      <div>
        <h1 className="text-xl font-bold text-stone-800">로그인</h1>
        <p className="mt-1 text-sm text-stone-500">
          아이디와 비밀번호로 로그인하세요.
          {nextPath !== "/" ? (
            <span className="mt-1 block text-xs text-signature-dark">
              로그인 후 이전 페이지로 돌아갑니다.
            </span>
          ) : null}
        </p>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-stone-700">아이디</span>
        <input
          value={loginId}
          onChange={(event) => setLoginId(event.target.value)}
          required
          autoComplete="username"
          inputMode="text"
          className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-base outline-none focus:border-signature sm:text-sm"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-stone-700">비밀번호</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
          className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-base outline-none focus:border-signature sm:text-sm"
        />
      </label>

      {error && (
        <p className="bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="portal-btn w-full min-h-11 py-3 text-sm touch-manipulation disabled:opacity-60"
      >
        {submitting ? "로그인 중..." : "로그인"}
      </button>

      <p className="text-center text-sm text-stone-500">
        계정이 없으신가요?{" "}
        <Link
          href={`/register${nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
          className="font-semibold text-signature-dark hover:underline"
        >
          회원가입
        </Link>
      </p>
    </form>
  );
}

export default function LoginPageClient() {
  return (
    <Suspense
      fallback={
        <div className="portal-panel p-6 text-sm text-stone-500">불러오는 중...</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
