"use client";

import { useCallback, useMemo, useState } from "react";
import { useEffect } from "react";
import RiderCafeCard from "@/components/cafes/RiderCafeCard";
import RiderCafeEditForm from "@/components/cafes/RiderCafeEditForm";
import RiderCafeUploadForm from "@/components/cafes/RiderCafeUploadForm";
import type { BariRoute } from "@/lib/routes-data";
import { fetchEngagementAction } from "@/lib/engagement-client";
import {
  filterRiderCafes,
  riderCafeCategories,
  type RiderCafeEntry,
} from "@/lib/rider-cafe";

type RiderCafeExplorerProps = {
  initialEntries?: RiderCafeEntry[];
  initialBariRoutes?: BariRoute[];
  initialQuery?: string;
};

export default function RiderCafeExplorer({
  initialEntries = [],
  initialBariRoutes: _initialBariRoutes = [],
  initialQuery = "",
}: RiderCafeExplorerProps) {
  const [entries, setEntries] = useState<RiderCafeEntry[]>(initialEntries);
  const [loading, setLoading] = useState(initialEntries.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] =
    useState<(typeof riderCafeCategories)[number]>("전체");
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const [editingEntry, setEditingEntry] = useState<RiderCafeEntry | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [likingId, setLikingId] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rider-cafes");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "라이더 카페 목록을 불러오지 못했습니다.");
      }

      setEntries(data.entries as RiderCafeEntry[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "라이더 카페 목록을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialEntries.length > 0) return;
    void loadEntries();
  }, [initialEntries.length, loadEntries]);

  const filteredEntries = useMemo(
    () => filterRiderCafes({ entries, region, query, sort }),
    [entries, region, query, sort]
  );

  const updateEntry = (updated: RiderCafeEntry) => {
    setEntries((current) =>
      current.map((entry) => (entry.id === updated.id ? updated : entry))
    );
  };

  const handleLike = async (id: string) => {
    setLikingId(id);

    try {
      const response = await fetchEngagementAction(`/api/rider-cafes/${id}`, {
        action: "like",
      });
      const data = await response.json();

      if (response.status === 401) return;
      if (!response.ok) {
        throw new Error(data.error ?? "추천 처리에 실패했습니다.");
      }

      updateEntry(data.entry as RiderCafeEntry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "추천 처리에 실패했습니다.");
    } finally {
      setLikingId(null);
    }
  };

  const handleCreated = (entry: RiderCafeEntry) => {
    setEntries((current) => [entry, ...current]);
  };

  const handleUpdated = (entry: RiderCafeEntry) => {
    updateEntry(entry);
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="portal-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-stone-700">라이더 카페 탐색</p>
            <p className="mt-1 text-xs text-stone-500">
              총 {filteredEntries.length}곳 · 주소와 사진으로 공유해요
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="portal-btn px-4 py-2 text-sm"
          >
            + 카페 등록
          </button>
        </div>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="카페 이름, 주소, 전화번호, 오는 길 검색..."
          className="mt-4 w-full rounded-2xl border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {riderCafeCategories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRegion(item)}
              className={`portal-filter-chip rounded-full transition ${
                region === item
                  ? "bg-signature text-white"
                  : "bg-signature-light text-stone-600 ring-1 ring-signature/20 hover:bg-signature-muted"
              }`}
            >
              {item}
            </button>
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

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-signature/20 bg-signature-light/40 text-sm text-stone-500">
          라이더 카페 불러오는 중...
        </div>
      ) : error && entries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-signature/30 bg-signature-light/40 px-6 py-12 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-signature/30 bg-signature-light/40 px-6 py-16 text-center">
          <p className="text-4xl">☕</p>
          <p className="mt-4 font-semibold text-stone-700">
            조건에 맞는 라이더 카페가 없습니다
          </p>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="portal-btn mt-4 px-4 py-2 text-sm"
          >
            첫 카페 등록하기
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEntries.map((entry) => (
            <RiderCafeCard
              key={entry.id}
              entry={entry}
              onLike={handleLike}
              liking={likingId === entry.id}
            />
          ))}
        </div>
      )}

      {error && entries.length > 0 && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {editingEntry && (
        <RiderCafeEditForm
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onUpdated={(entry) => {
            handleUpdated(entry);
            setEditingEntry(null);
          }}
        />
      )}

      {showUpload && (
        <RiderCafeUploadForm
          onClose={() => setShowUpload(false)}
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
          ? "bg-slate-800 text-white"
          : "bg-white text-stone-600 ring-1 ring-signature/20 hover:bg-signature-light"
      }`}
    >
      {children}
    </button>
  );
}
