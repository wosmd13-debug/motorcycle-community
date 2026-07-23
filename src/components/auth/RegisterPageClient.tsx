"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { safeNextPath } from "@/components/auth/useLoginRedirect";
import { setRegisterWelcomePending } from "@/lib/register-welcome";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nextPath = safeNextPath(searchParams.get("next"));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    if (!agreedToTerms) {
      setError("이용약관 및 개인정보처리방침에 동의해 주세요.");
      return;
    }

    setSubmitting(true);
    const message = await register(loginId, nickname, password);
    if (message) {
      setError(message);
      setSubmitting(false);
      return;
    }

    setRegisterWelcomePending(nickname.trim());
    router.push(nextPath);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="portal-panel space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-stone-800">회원가입</h1>
        <p className="mt-1 text-sm text-stone-500">
          아이디와 닉네임을 등록하고 커뮤니티에 참여하세요.
        </p>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-stone-700">아이디</span>
        <input
          value={loginId}
          onChange={(event) => setLoginId(event.target.value)}
          required
          autoComplete="username"
          placeholder="3~20자, 영문·숫자·_"
          className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-base outline-none focus:border-signature sm:text-sm"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-stone-700">닉네임</span>
        <input
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          required
          autoComplete="nickname"
          placeholder="지역_기종_나이"
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
          autoComplete="new-password"
          placeholder="영문+숫자 포함 8자 이상"
          className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-base outline-none focus:border-signature sm:text-sm"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-stone-700">비밀번호 확인</span>
        <input
          type="password"
          value={passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
          required
          autoComplete="new-password"
          className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-base outline-none focus:border-signature sm:text-sm"
        />
      </label>

      <label className="flex items-start gap-3 rounded border border-signature/15 bg-signature-light/30 px-4 py-3">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(event) => setAgreedToTerms(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-signature"
        />
        <span className="text-xs leading-5 text-stone-600">
          <Link href="/legal/terms" target="_blank" className="font-semibold text-signature-dark hover:underline">
            이용약관
          </Link>
          {" 및 "}
          <Link href="/legal/privacy" target="_blank" className="font-semibold text-signature-dark hover:underline">
            개인정보처리방침
          </Link>
          에 동의합니다. (필수)
        </span>
      </label>

      {error && (
        <p className="bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="portal-btn w-full py-3 text-sm disabled:opacity-60"
      >
        {submitting ? "가입 중..." : "회원가입"}
      </button>

      <p className="text-center text-sm text-stone-500">
        이미 계정이 있으신가요?{" "}
        <Link
          href={`/login${nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
          className="font-semibold text-signature-dark hover:underline"
        >
          로그인
        </Link>
      </p>
    </form>
  );
}

export default function RegisterPageClient() {
  return (
    <Suspense
      fallback={
        <div className="portal-panel p-6 text-sm text-stone-500">불러오는 중...</div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
