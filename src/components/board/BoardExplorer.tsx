"use client";

import { useMemo, useState } from "react";
import { useLoginRedirect } from "@/components/auth/useLoginRedirect";
import { BoardCategoryGuide } from "@/components/board/BoardCategoryGuide";
import BoardFeaturedBest, {
  pickFeaturedBoardPosts,
} from "@/components/board/BoardFeaturedBest";
import BoardPostRow from "@/components/board/BoardPostRow";
import BoardSidebar from "@/components/board/BoardSidebar";
import BoardWriteForm from "@/components/board/BoardWriteForm";
import { useMemberGradeLookup } from "@/hooks/useMemberGradeLookup";
import { useCosmeticLookup } from "@/hooks/useCosmeticLookup";
import {
  boardCategories,
  filterBoardPosts,
  type BoardCategory,
  type BoardPost,
} from "@/lib/board";
import { collectAuthorGradeSources } from "@/lib/member-grade-display";

type BoardExplorerProps = {
  initialPosts: BoardPost[];
  initialQuery?: string;
  initialCategory?: (typeof boardCategories)[number];
};

export default function BoardExplorer({
  initialPosts,
  initialQuery = "",
  initialCategory = "전체",
}: BoardExplorerProps) {
  const ensureLoggedIn = useLoginRedirect();
  const [posts, setPosts] = useState<BoardPost[]>(initialPosts);
  const [category, setCategory] =
    useState<(typeof boardCategories)[number]>(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const [showWrite, setShowWrite] = useState(false);
  const [writeCategory, setWriteCategory] = useState<BoardCategory>("자유");

  const filteredPosts = useMemo(
    () => filterBoardPosts({ posts, category, query, sort }),
    [posts, category, query, sort]
  );

  const featuredPosts = useMemo(
    () => pickFeaturedBoardPosts(posts, 4),
    [posts]
  );

  const gradeSources = useMemo(
    () => collectAuthorGradeSources(posts),
    [posts]
  );
  const gradesByNickname = useMemberGradeLookup(gradeSources);
  const authorNicknames = useMemo(
    () => gradeSources.map((item) => item.author),
    [gradeSources]
  );
  const looksByNickname = useCosmeticLookup(authorNicknames);

  const handleCreated = (post: BoardPost) => {
    setPosts((current) => [post, ...current]);
  };

  const openWriteForm = (prefillCategory?: BoardCategory) => {
    if (!ensureLoggedIn()) return;
    if (prefillCategory) setWriteCategory(prefillCategory);
    else if (category !== "전체") setWriteCategory(category);
    setShowWrite(true);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0">
        <BoardFeaturedBest posts={featuredPosts} looksByNickname={looksByNickname} />

        <div className="border border-[var(--dc-border)] bg-[var(--surface)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--dc-border-light)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">글 목록</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {category === "전체"
                  ? `총 ${filteredPosts.length}개의 글`
                  : `${category} · ${filteredPosts.length}개`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openWriteForm()}
              className="portal-btn px-4 py-2 text-sm"
            >
              + 글쓰기
            </button>
          </div>

          <div className="border-b border-[var(--dc-border-light)] px-4 py-3">
            <BoardCategoryGuide
              selected={category}
              onSelect={(value) => setCategory(value)}
              compact
            />
          </div>

          <div className="border-b border-[var(--dc-border-light)] px-4 py-3">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="제목, 작성자, 내용 검색..."
              className="w-full border border-signature/20 bg-signature-light/40 px-4 py-2.5 text-sm outline-none focus:border-signature"
            />

            <div className="mt-3 flex gap-2">
              <SortButton active={sort === "latest"} onClick={() => setSort("latest")}>
                최신순
              </SortButton>
              <SortButton
                active={sort === "popular"}
                onClick={() => setSort("popular")}
              >
                인기순
              </SortButton>
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-semibold text-[var(--text-secondary)]">
                조건에 맞는 글이 없습니다
              </p>
              <button
                type="button"
                onClick={() => openWriteForm()}
                className="portal-btn mt-4 px-4 py-2 text-sm"
              >
                첫 글 작성하기
              </button>
            </div>
          ) : (
            <div>
              {filteredPosts.map((post) => (
                <BoardPostRow
                  key={post.id}
                  post={post}
                  gradesByNickname={gradesByNickname}
                  looksByNickname={looksByNickname}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <BoardSidebar posts={posts} />

      {showWrite && (
        <BoardWriteForm
          initialCategory={writeCategory}
          onClose={() => setShowWrite(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
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
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-stone-800 text-white"
          : "bg-white text-stone-600 ring-1 ring-portal-border hover:bg-portal-muted"
      }`}
    >
      {children}
    </button>
  );
}
