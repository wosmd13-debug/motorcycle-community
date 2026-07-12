"use client";

import { useRouter } from "next/navigation";
import { FormEvent } from "react";

type SearchFormProps = {
  initialQuery?: string;
  compact?: boolean;
  onSubmitted?: () => void;
};

export default function SearchForm({
  initialQuery = "",
  compact = false,
  onSubmitted,
}: SearchFormProps) {
  const router = useRouter();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") ?? "").trim();

    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/search");
    }

    onSubmitted?.();
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex w-full min-w-0 gap-2">
        <input
          type="search"
          name="q"
          defaultValue={initialQuery}
          placeholder="통합 검색"
          className="theme-input h-10 min-w-0 flex-1 px-3 text-sm"
        />
        <button type="submit" className="portal-btn h-10 shrink-0 px-4 text-sm">
          검색
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="portal-panel flex flex-col gap-3 p-4 sm:flex-row">
      <input
        type="search"
        name="q"
        defaultValue={initialQuery}
        placeholder="자유게시판, 자유홍보, 갤러리, 영상, 카페, 바리 코스 통합 검색"
        className="theme-input h-11 min-w-0 flex-1 px-4 text-sm"
      />
      <button type="submit" className="portal-btn h-11 shrink-0 px-6 text-sm">
        검색
      </button>
    </form>
  );
}
