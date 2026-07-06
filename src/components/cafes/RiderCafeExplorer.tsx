"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RiderCafeCard from "@/components/cafes/RiderCafeCard";
import RiderCafeDetailModal from "@/components/cafes/RiderCafeDetailModal";
import RiderCafeEditForm from "@/components/cafes/RiderCafeEditForm";
import RiderCafeUploadForm from "@/components/cafes/RiderCafeUploadForm";
import {
  filterRiderCafes,
  riderCafeCategories,
  type RiderCafeEntry,
} from "@/lib/rider-cafe";

export default function RiderCafeExplorer() {
  const [entries, setEntries] = useState<RiderCafeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] =
    useState<(typeof riderCafeCategories)[number]>("전체");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const [selectedEntry, setSelectedEntry] = useState<RiderCafeEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<RiderCafeEntry | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

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
    void loadEntries();
  }, [loadEntries]);

  const filteredEntries = useMemo(
    () => filterRiderCafes({ entries, region, query, sort }),
    [entries, region, query, sort]
  );

  const updateEntry = (updated: RiderCafeEntry) => {
    setEntries((current) =>
      current.map((entry) => (entry.id === updated.id ? updated : entry))
    );
    setSelectedEntry((current) =>
      current?.id === updated.id ? updated : current
    );
  };

  const handleOpen = async (entry: RiderCafeEntry) => {
    setOpeningId(entry.id);
    setSelectedEntry(entry);

    try {
      const viewKey = `rider-cafe-view-${entry.id}`;
      let latest = entry;

      if (!sessionStorage.getItem(viewKey)) {
        sessionStorage.setItem(viewKey, "1");
        const viewRes = await fetch(`/api/rider-cafes/${entry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "view" }),
        });
        const viewData = await viewRes.json();
        if (viewRes.ok) {
          latest = viewData.entry as RiderCafeEntry;
        }
      }

      const detailRes = await fetch(`/api/rider-cafes/${entry.id}`);
      const detailData = await detailRes.json();
      if (detailRes.ok) {
        latest = detailData.entry as RiderCafeEntry;
      }

      updateEntry(latest);
      setSelectedEntry(latest);
    } catch {
      setError("카페 상세 정보를 불러오지 못했습니다.");
    } finally {
      setOpeningId(null);
    }
  };

  const handleLike = async (id: string) => {
    setLikingId(id);

    try {
      const response = await fetch(`/api/rider-cafes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like" }),
      });
      const data = await response.json();

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
      <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">라이더 카페 탐색</p>
            <p className="mt-1 text-xs text-slate-500">
              총 {filteredEntries.length}곳 · 주소와 사진으로 공유해요
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            + 카페 등록
          </button>
        </div>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="카페 이름, 주소, 전화번호, 오는 길 검색..."
          className="mt-4 w-full rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm outline-none focus:border-orange-300"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {riderCafeCategories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRegion(item)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                region === item
                  ? "bg-orange-500 text-white"
                  : "bg-orange-50 text-slate-600 ring-1 ring-orange-100 hover:bg-orange-100"
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
        <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-orange-100 bg-orange-50 text-sm text-slate-500">
          라이더 카페 불러오는 중...
        </div>
      ) : error && entries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-orange-200 bg-orange-50/60 px-6 py-12 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-orange-200 bg-orange-50/60 px-6 py-16 text-center">
          <p className="text-4xl">☕</p>
          <p className="mt-4 font-semibold text-slate-700">
            조건에 맞는 라이더 카페가 없습니다
          </p>
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="mt-4 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
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
              onOpen={handleOpen}
              onLike={handleLike}
              liking={likingId === entry.id || openingId === entry.id}
            />
          ))}
        </div>
      )}

      {error && entries.length > 0 && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {selectedEntry && !editingEntry && (
        <RiderCafeDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onLike={handleLike}
          onEdit={(entry) => setEditingEntry(entry)}
          liking={likingId === selectedEntry.id}
        />
      )}

      {editingEntry && (
        <RiderCafeEditForm
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onUpdated={(entry) => {
            handleUpdated(entry);
            setSelectedEntry(entry);
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
          : "bg-white text-slate-600 ring-1 ring-orange-100 hover:bg-orange-50"
      }`}
    >
      {children}
    </button>
  );
}
