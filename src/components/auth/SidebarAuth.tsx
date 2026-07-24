"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import MyRankSummary from "@/components/ranking/MyRankSummary";
import type { MemberRankEntry } from "@/lib/ranking";

export default function SidebarAuth() {
  const { user, loading, login, logout } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ranking, setRanking] = useState<MemberRankEntry | null>(null);

  useEffect(() => {
    if (!user) {
      setRanking(null);
      return;
    }

    let cancelled = false;

    void fetch("/api/ranking/me")
      .then(async (response) => {
        if (!response.ok) return null;
        const data = await response.json();
        return data.ranking as MemberRankEntry;
      })
      .then((data) => {
        if (!cancelled) setRanking(data);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const message = await login(loginId, password);
    if (message) setError(message);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <section className="portal-panel overflow-hidden">
        <div className="portal-panel-head">
          <h2 className="portal-panel-title">로그인</h2>
        </div>
        <p className="p-3 text-xs text-stone-400">불러오는 중...</p>
      </section>
    );
  }

  if (user) {
    return (
      <section className="portal-panel overflow-hidden">
        <div className="portal-panel-head">
          <h2 className="portal-panel-title">내 계정</h2>
        </div>
        <div className="space-y-3 bg-signature-light/30 p-3">
          <div>
            <p className="text-xs text-stone-500">닉네임</p>
            <AuthorWithGrade
              author={user.nickname}
              authorGradeId={
                user.isOperator ? "operator" : ranking?.grade?.id ?? "beginner"
              }
              nicknameClassName="text-sm font-bold text-signature-dark"
              className="inline-flex max-w-full flex-wrap items-center gap-1.5"
            />
          </div>
          <div>
            <p className="text-xs text-stone-500">아이디</p>
            <p className="text-sm text-stone-700">{user.loginId}</p>
          </div>
          <MyRankSummary />
          <Link
            href="/profile"
            className="block w-full border border-signature/30 bg-white py-2 text-center text-xs font-semibold text-signature-dark hover:bg-signature-light"
          >
            회원 정보 수정
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full border border-signature/30 bg-white py-2 text-xs font-semibold text-stone-600 hover:bg-signature-light"
          >
            로그아웃
          </button>
          {user.isOperator && (
            <>
              <Link
                href="/admin/reports"
                className="block w-full border border-red-200 bg-red-50 py-2 text-center text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                신고 관리
              </Link>
              <Link
                href="/admin/feedback"
                className="block w-full border border-amber-200 bg-amber-50 py-2 text-center text-xs font-semibold text-amber-800 hover:bg-amber-100"
              >
                건의·문의 관리
              </Link>
            </>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="portal-panel overflow-hidden">
      <div className="portal-panel-head">
        <h2 className="portal-panel-title">로그인</h2>
        <Link href="/register" className="portal-panel-more">
          가입
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2 bg-signature-light/30 p-3">
        <input
          value={loginId}
          onChange={(event) => setLoginId(event.target.value)}
          placeholder="아이디"
          required
          autoComplete="username"
          className="theme-input h-9 w-full px-3 text-sm"
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="비밀번호"
          required
          autoComplete="current-password"
          className="theme-input h-9 w-full px-3 text-sm"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="portal-btn h-9 w-full text-sm disabled:opacity-60"
        >
          {submitting ? "로그인 중..." : "로그인"}
        </button>
        <p className="text-center text-[11px] text-stone-500">
          <Link href="/login" className="text-signature-dark hover:underline">
            로그인 페이지
          </Link>
        </p>
      </form>
    </section>
  );
}
