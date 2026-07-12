"use client";

import { useMemo, useState } from "react";
import { useLoginRedirect } from "@/components/auth/useLoginRedirect";
import PromoBannerCard from "@/components/promo/PromoBannerCard";
import PromoCard from "@/components/promo/PromoCard";
import PromoWriteForm from "@/components/promo/PromoWriteForm";
import { fetchEngagementAction } from "@/lib/engagement-client";
import {
  filterPromoPosts,
  isPromoBanner,
  parsePromoCategoryParam,
  promoCategories,
  type PromoCategory,
  type PromoDisplayType,
  type PromoPost,
} from "@/lib/promo";

export default function PromoExplorer({
  initialPosts,
  initialQuery = "",
  initialCategory = "",
}: {
  initialPosts: PromoPost[];
  initialQuery?: string;
  initialCategory?: string;
}) {
  const ensureLoggedIn = useLoginRedirect();
  const [posts, setPosts] = useState<PromoPost[]>(initialPosts);
  const [error, setError] = useState<string | null>(null);
  const parsedInitialCategory = parsePromoCategoryParam(initialCategory);
  const [category, setCategory] = useState<(typeof promoCategories)[number]>(
    parsedInitialCategory ?? "전체"
  );
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const [showWrite, setShowWrite] = useState(false);
  const [writeCategory, setWriteCategory] = useState<PromoCategory>("채널·SNS");
  const [writeDisplayType, setWriteDisplayType] =
    useState<PromoDisplayType>("일반");
  const [likingId, setLikingId] = useState<string | null>(null);

  const filteredPosts = useMemo(
    () => filterPromoPosts({ posts, category, query, sort }),
    [posts, category, query, sort]
  );

  const updatePost = (updated: PromoPost) => {
    setPosts((current) =>
      current.map((post) => (post.id === updated.id ? updated : post))
    );
  };

  const handleLike = async (id: string) => {
    setLikingId(id);

    try {
      const response = await fetchEngagementAction(`/api/promo/${id}`, {
        action: "like",
      });
      const data = await response.json();

      if (response.status === 401) return;
      if (!response.ok) {
        throw new Error(data.error ?? "추천 처리에 실패했습니다.");
      }

      updatePost(data.post as PromoPost);
    } catch (err) {
      setError(err instanceof Error ? err.message : "추천 처리에 실패했습니다.");
    } finally {
      setLikingId(null);
    }
  };

  const handleCreated = (post: PromoPost) => {
    setPosts((current) => [post, ...current]);
  };

  const openWriteForm = (prefillCategory?: PromoCategory) => {
    if (!ensureLoggedIn()) return;
    if (prefillCategory) setWriteCategory(prefillCategory);
    else if (category !== "전체") setWriteCategory(category);
    setWriteDisplayType("일반");
    setShowWrite(true);
  };

  return (
    <div className="space-y-4">
      <div className="portal-panel overflow-hidden p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-stone-700">홍보글 목록</p>
            <p className="mt-1 text-xs text-stone-500">
              {category === "전체"
                ? `총 ${filteredPosts.length}개의 홍보글`
                : `${category} · ${filteredPosts.length}개`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => openWriteForm()}
            className="portal-btn px-4 py-2 text-sm"
          >
            + 홍보 등록
          </button>
        </div>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="제목, 작성자, 내용 검색..."
          className="mt-4 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {promoCategories.map((item) => (
            <FilterChip
              key={item}
              active={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </FilterChip>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <SortButton active={sort === "latest"} onClick={() => setSort("latest")}>
            최신순
          </SortButton>
          <SortButton active={sort === "popular"} onClick={() => setSort("popular")}>
            인기순
          </SortButton>
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="portal-panel border-dashed px-6 py-16 text-center">
          <p className="font-semibold text-stone-700">조건에 맞는 홍보글이 없습니다</p>
          <button
            type="button"
            onClick={() => openWriteForm()}
            className="portal-btn mt-4 px-4 py-2 text-sm"
          >
            첫 홍보글 등록하기
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post, index) =>
            isPromoBanner(post) ? (
              <div key={post.id} className="sm:col-span-2 lg:col-span-3">
                <PromoBannerCard
                  post={post}
                  priority={index === 0}
                />
              </div>
            ) : (
              <PromoCard
                key={post.id}
                post={post}
                onLike={handleLike}
                liking={likingId === post.id}
              />
            )
          )}
        </div>
      )}

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {showWrite && (
        <PromoWriteForm
          initialCategory={writeCategory}
          initialDisplayType={writeDisplayType}
          onClose={() => setShowWrite(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-signature text-white shadow-sm"
          : "bg-signature-light/60 text-stone-600 ring-1 ring-signature/20 hover:bg-signature-muted"
      }`}
    >
      {children}
    </button>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-stone-800 text-white"
          : "bg-white text-stone-600 ring-1 ring-portal-border hover:bg-portal-muted"
      }`}
    >
      {children}
    </button>
  );
}
