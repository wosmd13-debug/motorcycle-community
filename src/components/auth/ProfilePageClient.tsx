"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import LoginRequired from "@/components/auth/LoginRequired";
import MyRankSummary from "@/components/ranking/MyRankSummary";

type ProfileData = {
  loginId: string;
  nickname: string;
  createdAt: string;
};

function ProfileForm() {
  const router = useRouter();
  const { user, refresh, withdrawAccount } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [nickname, setNickname] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [withdrawConfirmed, setWithdrawConfirmed] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setLoadingProfile(true);

    void fetch("/api/auth/profile")
      .then(async (response) => {
        if (!response.ok) return null;
        const data = await response.json();
        return data as { user: { loginId: string; nickname: string }; createdAt: string };
      })
      .then((data) => {
        if (cancelled || !data) return;
        setProfile({
          loginId: data.user.loginId,
          nickname: data.user.nickname,
          createdAt: data.createdAt,
        });
        setNickname(data.user.nickname);
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!profile) return;

    const nicknameChanged = nickname.trim() !== profile.nickname;
    const passwordChanged = newPassword.length > 0;

    if (!nicknameChanged && !passwordChanged) {
      setError("변경할 정보를 입력해 주세요.");
      return;
    }

    if (passwordChanged && newPassword !== newPasswordConfirm) {
      setError("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setSubmitting(true);

    const response = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: nicknameChanged ? nickname.trim() : undefined,
        currentPassword,
        newPassword: passwordChanged ? newPassword : undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError((data.error as string) ?? "회원 정보 수정에 실패했습니다.");
      setSubmitting(false);
      return;
    }

    await refresh();
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            nickname: data.user.nickname as string,
          }
        : prev
    );
    setCurrentPassword("");
    setNewPassword("");
    setNewPasswordConfirm("");
    setSuccess((data.message as string) ?? "회원 정보가 수정되었습니다.");
    setSubmitting(false);
  };

  const handleWithdraw = async (event: FormEvent) => {
    event.preventDefault();
    setWithdrawError(null);

    if (!withdrawConfirmed) {
      setWithdrawError("탈퇴 안내 사항에 동의해 주세요.");
      return;
    }

    if (!window.confirm("정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    setWithdrawing(true);

    const message = await withdrawAccount(withdrawPassword);
    if (message) {
      setWithdrawError(message);
      setWithdrawing(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  if (loadingProfile) {
    return (
      <div className="portal-panel p-6 text-sm text-stone-500">불러오는 중...</div>
    );
  }

  if (!profile) {
    return (
      <div className="portal-panel p-6 text-sm text-red-600">
        회원 정보를 불러오지 못했습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="portal-panel overflow-hidden">
        <div className="portal-panel-head">
          <h2 className="portal-panel-title">계정 정보</h2>
        </div>
        <dl className="grid gap-4 p-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-stone-500">아이디</dt>
            <dd className="mt-1 text-sm font-semibold text-stone-800">
              {profile.loginId}
            </dd>
            <p className="mt-1 text-[11px] text-stone-400">아이디는 변경할 수 없습니다.</p>
          </div>
          <div>
            <dt className="text-xs text-stone-500">가입일</dt>
            <dd className="mt-1 text-sm text-stone-700">
              {new Date(profile.createdAt).toLocaleDateString("ko-KR")}
            </dd>
          </div>
        </dl>
        <div className="border-t border-signature/10 p-4">
          <MyRankSummary />
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold text-signature-dark">
            <Link href="/shop" className="hover:underline">
              포인트 상점 →
            </Link>
            <Link href="/missions" className="hover:underline">
              라이딩 미션 →
            </Link>
            <Link href="/garage" className="hover:underline">
              내 차고 →
            </Link>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="portal-panel space-y-4 p-6">
        <div>
          <h2 className="text-lg font-bold text-stone-800">정보 수정</h2>
          <p className="mt-1 text-sm text-stone-500">
            닉네임 또는 비밀번호를 변경할 수 있습니다. 보안을 위해 현재 비밀번호가
            필요합니다.
          </p>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-stone-700">닉네임</span>
          <input
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            required
            autoComplete="nickname"
            placeholder="2~12자, 게시글에 표시됩니다"
            className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-stone-700">현재 비밀번호</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            autoComplete="current-password"
            className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
          />
        </label>

        <div className="rounded border border-signature/10 bg-signature-light/20 p-4">
          <p className="text-sm font-semibold text-stone-700">비밀번호 변경 (선택)</p>
          <p className="mt-1 text-xs text-stone-500">
            변경하지 않으려면 비워 두세요.
          </p>

          <label className="mt-3 block">
            <span className="text-sm font-semibold text-stone-700">새 비밀번호</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="영문+숫자 포함 8자 이상"
              className="mt-2 w-full border border-signature/20 bg-white px-4 py-3 text-sm outline-none focus:border-signature"
            />
          </label>

          <label className="mt-3 block">
            <span className="text-sm font-semibold text-stone-700">새 비밀번호 확인</span>
            <input
              type="password"
              value={newPasswordConfirm}
              onChange={(event) => setNewPasswordConfirm(event.target.value)}
              autoComplete="new-password"
              className="mt-2 w-full border border-signature/20 bg-white px-4 py-3 text-sm outline-none focus:border-signature"
            />
          </label>
        </div>

        {error && (
          <p className="bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}
        {success && (
          <p className="bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={submitting}
            className="portal-btn w-full px-5 py-3 text-sm disabled:opacity-60 sm:w-auto"
          >
            {submitting ? "저장 중..." : "변경 사항 저장"}
          </button>
          <Link
            href="/"
            className="w-full border border-signature/30 bg-white px-5 py-3 text-center text-sm font-semibold text-stone-600 hover:bg-signature-light sm:w-auto"
          >
            취소
          </Link>
        </div>
      </form>

      {!user?.isOperator && (
      <form onSubmit={handleWithdraw} className="portal-panel space-y-4 border-red-200 p-6">
        <div>
          <h2 className="text-lg font-bold text-red-700">회원 탈퇴</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            탈퇴 시 계정 정보와 차고·정비 일지가 삭제되며, 작성한 게시물·댓글은
            「탈퇴한 회원」으로 표시됩니다. 등록한 회원 코스는 삭제됩니다.
          </p>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-stone-700">비밀번호 확인</span>
          <input
            type="password"
            value={withdrawPassword}
            onChange={(event) => setWithdrawPassword(event.target.value)}
            required
            autoComplete="current-password"
            className="mt-2 w-full border border-red-200 bg-red-50/40 px-4 py-3 text-sm outline-none focus:border-red-400"
          />
        </label>

        <label className="flex items-start gap-3 rounded border border-red-200 bg-red-50/50 px-4 py-3">
          <input
            type="checkbox"
            checked={withdrawConfirmed}
            onChange={(event) => setWithdrawConfirmed(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-red-600"
          />
          <span className="text-xs leading-5 text-stone-600">
            탈퇴 후 계정 복구가 불가능함을 확인했으며, 위 안내에 동의합니다.
          </span>
        </label>

        {withdrawError && (
          <p className="bg-red-50 px-4 py-3 text-sm text-red-600">{withdrawError}</p>
        )}

        <button
          type="submit"
          disabled={withdrawing}
          className="w-full border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {withdrawing ? "탈퇴 처리 중..." : "회원 탈퇴"}
        </button>
      </form>
      )}
    </div>
  );
}

export default function ProfilePageClient() {
  return (
    <LoginRequired actionLabel="회원 정보 수정">
      <ProfileForm />
    </LoginRequired>
  );
}
