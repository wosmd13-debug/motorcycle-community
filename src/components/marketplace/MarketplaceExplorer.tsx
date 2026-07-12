"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLoginRedirect } from "@/components/auth/useLoginRedirect";
import MarketplaceCard from "@/components/marketplace/MarketplaceCard";
import MarketplaceWriteForm from "@/components/marketplace/MarketplaceWriteForm";
import { fetchEngagementAction } from "@/lib/engagement-client";
import {
  filterMarketplaceItems,
  marketplaceCategories,
  marketplaceRegions,
  marketplaceStatuses,
  type MarketplaceItem,
  type MarketplaceSort,
} from "@/lib/marketplace";

export default function MarketplaceExplorer({
  initialItems,
  initialQuery = "",
}: {
  initialItems: MarketplaceItem[];
  initialQuery?: string;
}) {
  const { user } = useAuth();
  const ensureLoggedIn = useLoginRedirect();
  const [items, setItems] = useState<MarketplaceItem[]>(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] =
    useState<(typeof marketplaceCategories)[number]>("전체");
  const [region, setRegion] =
    useState<(typeof marketplaceRegions)[number]>("전체");
  const [status, setStatus] =
    useState<(typeof marketplaceStatuses)[number] | "전체">("전체");
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<MarketplaceSort>("latest");
  const [showWrite, setShowWrite] = useState(false);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [mineOnly, setMineOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);

  const filteredItems = useMemo(
    () =>
      filterMarketplaceItems({
        items,
        category,
        region,
        status,
        query,
        sort,
        sellerId: mineOnly && user ? user.id : undefined,
        availableOnly,
      }),
    [items, category, region, status, query, sort, mineOnly, user, availableOnly]
  );

  const handleLike = async (id: string) => {
    setLikingId(id);

    try {
      const response = await fetchEngagementAction(`/api/marketplace/${id}`, {
        action: "like",
      });
      const data = await response.json();

      if (response.status === 401) return;
      if (!response.ok) {
        throw new Error(data.error ?? "관심 등록에 실패했습니다.");
      }

      const updated = data.item as MarketplaceItem;
      setItems((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "관심 등록에 실패했습니다.");
    } finally {
      setLikingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="portal-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-stone-700">중고거래</p>
            <p className="mt-1 text-xs text-stone-500">
              총 {filteredItems.length}개의 매물
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (ensureLoggedIn()) setShowWrite(true);
            }}
            className="portal-btn px-4 py-2 text-sm"
          >
            + 매물 등록
          </button>
        </div>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="제목, 판매자, 지역, 가격 검색..."
          className="mt-4 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {marketplaceCategories.map((item) => (
            <FilterChip
              key={item}
              active={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </FilterChip>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {marketplaceRegions.map((item) => (
            <FilterChip
              key={item}
              active={region === item}
              onClick={() => setRegion(item)}
            >
              {item}
            </FilterChip>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <FilterChip active={status === "전체"} onClick={() => setStatus("전체")}>
            전체 상태
          </FilterChip>
          <FilterChip
            active={availableOnly}
            onClick={() => setAvailableOnly((current) => !current)}
          >
            판매중만
          </FilterChip>
          {user && (
            <FilterChip
              active={mineOnly}
              onClick={() => setMineOnly((current) => !current)}
            >
              내 매물
            </FilterChip>
          )}
          {marketplaceStatuses.map((item) => (
            <FilterChip
              key={item}
              active={status === item}
              onClick={() => setStatus(item)}
            >
              {item}
            </FilterChip>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <SortButton active={sort === "latest"} onClick={() => setSort("latest")}>
            최신순
          </SortButton>
          <SortButton active={sort === "popular"} onClick={() => setSort("popular")}>
            인기순
          </SortButton>
          <SortButton
            active={sort === "price-asc"}
            onClick={() => setSort("price-asc")}
          >
            낮은 가격
          </SortButton>
          <SortButton
            active={sort === "price-desc"}
            onClick={() => setSort("price-desc")}
          >
            높은 가격
          </SortButton>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="portal-panel border-dashed px-6 py-16 text-center">
          <p className="font-semibold text-stone-700">조건에 맞는 매물이 없습니다</p>
          <button
            type="button"
            onClick={() => {
              if (ensureLoggedIn()) setShowWrite(true);
            }}
            className="portal-btn mt-4 px-4 py-2 text-sm"
          >
            첫 매물 등록하기
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <MarketplaceCard
              key={item.id}
              item={item}
              onLike={handleLike}
              liking={likingId === item.id}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {showWrite && (
        <MarketplaceWriteForm
          onClose={() => setShowWrite(false)}
          onCreated={(item) => setItems((current) => [item, ...current])}
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
      className={`portal-filter-chip rounded-full transition ${
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
