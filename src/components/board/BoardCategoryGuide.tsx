"use client";

import {
  boardCategoryMeta,
  getBoardCategoryMeta,
  writableBoardCategories,
  type BoardCategory,
} from "@/lib/board";

type BoardCategoryBadgeProps = {
  category: BoardCategory;
  size?: "sm" | "md";
};

export function BoardCategoryBadge({
  category,
  size = "sm",
}: BoardCategoryBadgeProps) {
  const meta = boardCategoryMeta[category];
  const sizeClass =
    size === "md"
      ? "px-3 py-1 text-sm"
      : "px-2.5 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ring-1 ${sizeClass} ${meta.badgeClass}`}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}

type BoardCategoryGuideProps = {
  selected?: BoardCategory | "전체";
  onSelect?: (category: BoardCategory | "전체") => void;
  compact?: boolean;
  hideAllOption?: boolean;
};

export function BoardCategoryGuide({
  selected = "전체",
  onSelect,
  compact = false,
  hideAllOption = false,
}: BoardCategoryGuideProps) {
  const selectedMeta = getBoardCategoryMeta(selected);

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
          <p className="text-sm font-bold text-amber-950">📌 처음 이용하시나요?</p>
          <p className="mt-1 text-xs leading-5 text-amber-900">
            아래 카테고리를 눌러 어떤 글을 쓰면 좋은지 확인하세요. 글쓰기에서도
            같은 안내가 표시됩니다.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {!hideAllOption && (
          <button
            type="button"
            onClick={() => onSelect?.("전체")}
            className={`rounded-2xl border p-4 text-left transition ${
              selected === "전체"
                ? "border-slate-800 bg-slate-800 text-white shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <p className="text-lg">📋</p>
            <p className="mt-2 font-bold">전체</p>
            <p
              className={`mt-1 text-xs leading-5 ${
                selected === "전체" ? "text-slate-200" : "text-slate-500"
              }`}
            >
              모든 카테고리 글 보기
            </p>
          </button>
        )}

        {writableBoardCategories.map((category) => {
          const meta = boardCategoryMeta[category];
          const active = selected === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelect?.(category)}
              className={`rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-slate-800 bg-slate-800 text-white shadow-sm"
                  : meta.cardClass
              }`}
            >
              <p className="text-lg">{meta.emoji}</p>
              <p className="mt-2 font-bold">{meta.label}</p>
              <p
                className={`mt-1 text-xs leading-5 ${
                  active ? "text-slate-200" : "text-slate-600"
                }`}
              >
                {meta.summary}
              </p>
            </button>
          );
        })}
      </div>

      {selectedMeta && (
        <div className="rounded-2xl border border-orange-100 bg-white px-4 py-4">
          <p className="text-sm font-bold text-slate-800">
            {selectedMeta.emoji} {selectedMeta.label} 게시판
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {selectedMeta.description}
          </p>
          <p className="mt-3 text-xs font-semibold text-slate-500">이런 글을 올려요</p>
          <ul className="mt-1.5 list-inside list-disc text-xs leading-6 text-slate-600">
            {selectedMeta.examples.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
