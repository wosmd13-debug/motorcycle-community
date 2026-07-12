"use client";

import {
  canBumpMarketplaceItem,
  getBumpCooldownLabel,
  marketplaceStatuses,
  type MarketplaceItem,
  type MarketplaceStatus,
} from "@/lib/marketplace";

type MarketplaceSellerPanelProps = {
  item: MarketplaceItem;
  isOwner: boolean;
  onStatusChange: (status: MarketplaceStatus) => void;
  onBump: () => void;
  onEdit: () => void;
  onDelete: () => void;
  statusChanging?: boolean;
  bumping?: boolean;
  deleting?: boolean;
};

const statusButtonClass: Record<MarketplaceStatus, string> = {
  판매중: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  예약중: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  판매완료: "border-stone-300 bg-stone-100 text-stone-700 hover:bg-stone-200",
};

export default function MarketplaceSellerPanel({
  item,
  isOwner,
  onStatusChange,
  onBump,
  onEdit,
  onDelete,
  statusChanging = false,
  bumping = false,
  deleting = false,
}: MarketplaceSellerPanelProps) {
  const bumpReady = canBumpMarketplaceItem(item);
  const bumpLabel = getBumpCooldownLabel(item);

  return (
    <section className="rounded-3xl border border-signature/30 bg-signature-light/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-stone-800">
            {isOwner ? "내 매물 관리" : "매물 관리"}
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            거래 상태를 바로 변경하거나 매물을 수정할 수 있습니다.
          </p>
        </div>
        {!isOwner && (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
            운영자
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-stone-600">거래 상태</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {marketplaceStatuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onStatusChange(status)}
              disabled={statusChanging || item.status === status}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-default disabled:opacity-100 ${
                item.status === status
                  ? "border-signature bg-signature text-white shadow-sm"
                  : statusButtonClass[status]
              }`}
            >
              {status}
              {item.status === status ? " ✓" : ""}
            </button>
          ))}
        </div>
        {item.statusUpdatedAt && (
          <p className="mt-2 text-[11px] text-stone-400">
            상태 변경:{" "}
            {new Date(item.statusUpdatedAt).toLocaleString("ko-KR", {
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onBump}
          disabled={!bumpReady || bumping}
          className="rounded-full border border-signature/30 bg-white px-3 py-1.5 text-xs font-semibold text-signature-dark hover:bg-signature-light disabled:opacity-60"
        >
          {bumping ? "끌어올리는 중..." : bumpReady ? "끌어올리기" : `끌어올리기 (${bumpLabel})`}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full border border-signature/30 bg-white px-3 py-1.5 text-xs font-semibold text-signature-dark hover:bg-signature-light"
        >
          수정
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
        >
          {deleting ? "삭제 중..." : "삭제"}
        </button>
      </div>
    </section>
  );
}
