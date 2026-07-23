"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  buildFeedbackMailtoUrl,
  feedbackCategories,
  feedbackCategoryLabels,
  type FeedbackCategory,
} from "@/lib/feedback";
import { siteLegalInfo } from "@/lib/site-legal";

export default function FeedbackForm() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [category, setCategory] = useState<FeedbackCategory>("suggestion");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const pageUrl =
    typeof window !== "undefined"
      ? window.location.origin + (pathname || "/feedback")
      : siteLegalInfo.siteUrl + "/feedback";

  const mailtoHref = useMemo(
    () =>
      buildFeedbackMailtoUrl({
        category,
        title: title || "제목 없음",
        message: message || "(내용을 작성해 주세요)",
        contactEmail: contactEmail || undefined,
        pageUrl,
        nickname: (user?.nickname ?? nickname) || undefined,
      }),
    [category, title, message, contactEmail, pageUrl, user?.nickname, nickname]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title,
          message,
          contactEmail,
          nickname: user?.nickname ?? nickname,
          pageUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          (data.error as string) ?? "건의·문의 접수에 실패했습니다."
        );
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "건의·문의 접수에 실패했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="portal-panel space-y-4 p-6">
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          건의·문의가 접수되었습니다. 검토 후 입력하신 이메일로 답변드리겠습니다.
        </p>
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setTitle("");
            setMessage("");
            if (!user) {
              setNickname("");
              setContactEmail("");
            }
          }}
          className="portal-btn w-full py-2.5 text-sm"
        >
          추가로 보내기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="portal-panel space-y-5 p-6">
        <div>
          <label className="text-sm font-semibold text-stone-700">유형</label>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as FeedbackCategory)
            }
            className="mt-2 w-full rounded-2xl border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
          >
            {feedbackCategories.map((item) => (
              <option key={item} value={item}>
                {feedbackCategoryLabels[item]}
              </option>
            ))}
          </select>
        </div>

        {!user && (
          <div>
            <label className="text-sm font-semibold text-stone-700">
              이름 또는 닉네임
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              required
              maxLength={30}
              placeholder="홍길동"
              className="mt-2 w-full rounded-2xl border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
            />
          </div>
        )}

        <div>
          <label className="text-sm font-semibold text-stone-700">제목</label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={100}
            placeholder="예: 갤러리 사진이 안 올라가요"
            className="mt-2 w-full rounded-2xl border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-stone-700">내용</label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
            rows={6}
            maxLength={2000}
            placeholder="버그 재현 방법, 건의 내용, 신고 사유 등을 구체적으로 적어 주세요."
            className="mt-2 w-full rounded-2xl border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-stone-700">
            회신 이메일
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            required
            placeholder="example@email.com"
            className="mt-2 w-full rounded-2xl border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
          />
          <p className="mt-1 text-xs text-stone-500">
            답변을 받을 이메일 주소입니다.
          </p>
        </div>

        {user && (
          <p className="text-xs text-stone-500">
            {user.nickname}으로 접수됩니다.
          </p>
        )}

        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="portal-btn w-full py-3 text-sm disabled:opacity-60"
        >
          {submitting ? "접수 중..." : "사이트로 접수하기"}
        </button>
      </form>

      <section className="portal-panel p-6 text-sm text-stone-600">
        <h2 className="font-bold text-stone-800">다른 방법으로 문의하기</h2>
        <p className="mt-2 leading-6">
          메일 앱으로 바로 보내거나, 특정 게시물 신고는 해당 글의{" "}
          <strong>신고</strong> 버튼을 이용해 주세요.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={mailtoHref}
            className="portal-btn inline-flex px-4 py-2.5 text-sm"
          >
            메일로 보내기
          </a>
          <a
            href={`mailto:${siteLegalInfo.contactEmail}`}
            className="inline-flex items-center rounded-2xl border border-signature/20 bg-white px-4 py-2.5 text-sm font-semibold text-signature-dark hover:bg-signature-light"
          >
            {siteLegalInfo.contactEmail}
          </a>
        </div>
        {!user && (
          <p className="mt-4 text-xs text-stone-500">
            회원이시면{" "}
            <Link
              href={`/login?next=${encodeURIComponent(pathname || "/feedback")}`}
              className="font-semibold text-signature-dark hover:underline"
            >
              로그인
            </Link>
            후 접수하시면 처리에 도움이 됩니다.
          </p>
        )}
      </section>
    </div>
  );
}
