"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import { invalidateCosmeticLooks } from "@/hooks/cosmetic-look-cache";
import type { ShopCosmeticLook, ShopEquipped, ShopItemKind } from "@/lib/shop";
import type { MemberGradeId } from "@/lib/ranking";

type CatalogItem = {
  id: string;
  kind: ShopItemKind;
  kindLabel: string;
  name: string;
  description: string;
  price: number;
  consumable?: boolean;
  durationDays?: number;
  slot?: keyof ShopEquipped;
  previewClass: string;
  badgeLabel?: string;
  value: string;
  owned: boolean;
  equipped: boolean;
  canAfford: boolean;
};

type ShopDashboard = {
  wallet: {
    balance: number;
    lifetimeEarned: number;
    lifetimeSpent: number;
  };
  unlimited?: boolean;
  inventory: {
    ownedItemIds: string[];
    equipped: ShopEquipped;
    boosts: {
      postHighlightUntil?: string;
      gallerySpotlightUntil?: string;
    };
  };
  ledger: Array<{
    id: string;
    type: "earn" | "spend";
    amount: number;
    reason: string;
    createdAt: string;
  }>;
  look: ShopCosmeticLook;
  catalog: CatalogItem[];
};

type ShopResponse = {
  requiresAuth?: boolean;
  dashboard?: ShopDashboard | null;
  error?: string;
};

const KIND_TABS: Array<{ id: "all" | ShopItemKind; label: string }> = [
  { id: "all", label: "전체" },
  { id: "nickname_color", label: "닉네임" },
  { id: "name_frame", label: "프레임" },
  { id: "title_badge", label: "칭호" },
  { id: "boost", label: "부스트" },
];

function formatRemain(iso?: string) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "만료됨";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}일 ${hours}시간 남음`;
  return `${hours}시간 남음`;
}

export default function ShopExplorer({
  initialDashboard,
  initialRequiresAuth,
}: {
  initialDashboard: ShopDashboard | null;
  initialRequiresAuth: boolean;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [requiresAuth, setRequiresAuth] = useState(initialRequiresAuth);
  const [tab, setTab] = useState<"all" | ShopItemKind>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [previewGradeId, setPreviewGradeId] = useState<MemberGradeId | undefined>();

  const refresh = useCallback(async () => {
    const response = await fetch("/api/shop");
    const data = (await response.json()) as ShopResponse;
    if (!response.ok) throw new Error(data.error ?? "상점을 불러오지 못했습니다.");
    setRequiresAuth(Boolean(data.requiresAuth));
    setDashboard(data.dashboard ?? null);
  }, []);

  useEffect(() => {
    if (!user) {
      setRequiresAuth(true);
      setDashboard(null);
      setPreviewGradeId(undefined);
      return;
    }
    void refresh().catch(() => undefined);
    if (user.isOperator) {
      setPreviewGradeId("operator");
      return;
    }
    void fetch("/api/ranking/me")
      .then(async (response) => {
        if (!response.ok) return null;
        const data = await response.json();
        return data.ranking?.grade?.id as MemberGradeId | undefined;
      })
      .then((gradeId) => {
        if (gradeId) setPreviewGradeId(gradeId);
      });
  }, [user, refresh]);

  const filtered = useMemo(() => {
    if (!dashboard) return [];
    if (tab === "all") return dashboard.catalog;
    return dashboard.catalog.filter((item) => item.kind === tab);
  }, [dashboard, tab]);

  const runAction = async (
    body: Record<string, unknown>,
    successMessage: string,
    busyKey: string
  ) => {
    setBusyId(busyKey);
    setError(null);
    try {
      const response = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "처리에 실패했습니다.");
      }
      setDashboard(data.dashboard as ShopDashboard);
      if (user?.nickname) {
        invalidateCosmeticLooks([user.nickname]);
      }
      setToast(successMessage);
      window.setTimeout(() => setToast(null), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "처리에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  if (requiresAuth || !user) {
    return (
      <section className="portal-panel overflow-hidden">
        <div className="bg-gradient-to-br from-[#0f172a] via-[#14532d] to-signature-dark px-6 py-12 text-white">
          <p className="text-xs font-bold tracking-[0.2em] text-signature-mid">
            POINT SHOP
          </p>
          <h2 className="mt-3 text-3xl font-black">미션 포인트로 나를 꾸미기</h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-white/85">
            미션 보상으로 모은 포인트를 닉네임 색상·프레임·칭호·부스트로
            교환하세요. 랭킹 점수는 그대로 유지됩니다.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(pathname || "/shop")}`}
            className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-signature-darker"
          >
            로그인하고 상점 열기
          </Link>
        </div>
      </section>
    );
  }

  if (!dashboard) {
    return (
      <div className="portal-panel px-6 py-16 text-center text-sm text-stone-500">
        상점 불러오는 중...
      </div>
    );
  }

  const previewLook = dashboard.look;

  return (
    <div className="space-y-4">
      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-bold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <section className="portal-panel overflow-hidden">
        <div className="bg-gradient-to-br from-[#0f172a] via-[#14532d] to-signature-dark px-5 py-7 text-white sm:px-8">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-[11px] font-bold tracking-[0.18em] text-signature-mid">
                RIDE POINT SHOP
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">
                포인트 상점
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/80">
                미션으로 받은 포인트를 여기서 사용합니다. 랭킹용 누적 점수와는
                별도 지갑입니다.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-white/15 bg-black/20 px-4 py-3">
                  <p className="text-[10px] text-white/70">사용 가능</p>
                  <p className="mt-1 text-2xl font-black text-signature-mid">
                    {dashboard.unlimited || user.isOperator
                      ? "무제한"
                      : (
                          <>
                            {dashboard.wallet.balance.toLocaleString("ko-KR")}
                            <span className="ml-1 text-sm">P</span>
                          </>
                        )}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-black/20 px-4 py-3">
                  <p className="text-[10px] text-white/70">누적 획득</p>
                  <p className="mt-1 text-2xl font-black">
                    {dashboard.unlimited || user.isOperator
                      ? "—"
                      : `${dashboard.wallet.lifetimeEarned.toLocaleString("ko-KR")}P`}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-black/20 px-4 py-3">
                  <p className="text-[10px] text-white/70">누적 사용</p>
                  <p className="mt-1 text-2xl font-black">
                    {dashboard.unlimited || user.isOperator
                      ? "—"
                      : `${dashboard.wallet.lifetimeSpent.toLocaleString("ko-KR")}P`}
                  </p>
                </div>
              </div>
              {dashboard.unlimited || user.isOperator ? (
                <p className="mt-4 text-xs font-bold text-signature-mid">
                  운영자 계정 · 상점 포인트 무제한
                </p>
              ) : (
                <Link
                  href="/missions"
                  className="mt-4 inline-flex text-xs font-bold text-signature-mid hover:underline"
                >
                  미션 깨고 포인트 모으기 →
                </Link>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs font-bold text-signature-mid">미리보기</p>
              <div className="mt-3 rounded-xl bg-white/95 px-4 py-4 text-stone-800">
                <AuthorWithGrade
                  author={user.nickname}
                  authorGradeId={previewGradeId}
                  cosmeticLook={previewLook}
                  nicknameClassName="font-semibold text-stone-800"
                />
                <p className="mt-3 text-[11px] text-stone-500">
                  게시판·댓글·갤러리에서 코스메틱과 등급이 함께 보입니다.
                </p>
                {(dashboard.inventory.boosts.postHighlightUntil ||
                  dashboard.inventory.boosts.gallerySpotlightUntil) && (
                  <div className="mt-3 space-y-1 text-[11px] text-stone-600">
                    {dashboard.inventory.boosts.postHighlightUntil ? (
                      <p>
                        게시글 하이라이트 ·{" "}
                        {formatRemain(
                          dashboard.inventory.boosts.postHighlightUntil
                        )}
                      </p>
                    ) : null}
                    {dashboard.inventory.boosts.gallerySpotlightUntil ? (
                      <p>
                        갤러리 스포트라이트 ·{" "}
                        {formatRemain(
                          dashboard.inventory.boosts.gallerySpotlightUntil
                        )}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {KIND_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              tab === item.id
                ? "bg-signature-dark text-white"
                : "bg-[var(--surface)] text-[var(--text-secondary)] ring-1 ring-[var(--border-default)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="portal-panel flex flex-col overflow-hidden p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold text-[var(--text-faint)]">
                  {item.kindLabel}
                </p>
                <h3 className="mt-1 text-sm font-bold text-[var(--text-primary)]">
                  {item.name}
                </h3>
              </div>
              <span className="rounded-full bg-signature-dark px-2.5 py-1 text-[11px] font-extrabold text-white">
                {item.price}P
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
              {item.description}
            </p>

            <div className="mt-3 rounded-xl bg-[var(--surface-subtle,var(--signature-light))] px-3 py-3">
              {item.kind === "title_badge" ? (
                <span className={item.previewClass}>
                  {item.badgeLabel ?? item.value}
                </span>
              ) : item.kind === "name_frame" ? (
                <span className={`${item.previewClass} text-sm font-bold`}>
                  {user.nickname}
                </span>
              ) : item.kind === "nickname_color" ? (
                <span className={`${item.previewClass} text-sm`}>
                  {user.nickname}
                </span>
              ) : (
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${item.previewClass}`}
                >
                  {item.durationDays}일 부스트
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {!item.owned || item.consumable ? (
                <button
                  type="button"
                  disabled={Boolean(busyId) || (!item.canAfford && !item.owned)}
                  onClick={() =>
                    void runAction(
                      { action: "purchase", itemId: item.id },
                      item.consumable
                        ? `${item.name} 적용!`
                        : `${item.name} 구매 완료`,
                      item.id
                    )
                  }
                  className="portal-btn px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  {busyId === item.id
                    ? "처리 중..."
                    : item.consumable
                      ? item.owned
                        ? "기간 연장"
                        : "구매·적용"
                      : item.canAfford
                        ? "구매하기"
                        : "포인트 부족"}
                </button>
              ) : null}

              {item.owned && item.slot ? (
                <button
                  type="button"
                  disabled={Boolean(busyId)}
                  onClick={() =>
                    void runAction(
                      {
                        action: "equip",
                        slot: item.slot,
                        itemId: item.equipped ? null : item.id,
                      },
                      item.equipped ? "장착 해제" : "장착 완료",
                      `equip-${item.id}`
                    )
                  }
                  className="rounded-full border border-signature/30 bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-signature-dark"
                >
                  {busyId === `equip-${item.id}`
                    ? "처리 중..."
                    : item.equipped
                      ? "장착 해제"
                      : "장착하기"}
                </button>
              ) : null}

              {item.owned && !item.consumable ? (
                <span className="inline-flex items-center rounded-full bg-signature-muted px-2.5 py-1 text-[11px] font-bold text-signature-darker">
                  보유 중
                </span>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <section className="portal-panel p-4 sm:p-5">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">
          최근 포인트 내역
        </h3>
        {dashboard.ledger.length === 0 ? (
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            아직 내역이 없습니다. 미션 보상을 받으면 여기에 표시됩니다.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--border-subtle)]">
            {dashboard.ledger.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 py-2.5 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--text-primary)]">
                    {entry.reason}
                  </p>
                  <p className="text-[var(--text-faint)]">
                    {new Date(entry.createdAt).toLocaleString("ko-KR")}
                  </p>
                </div>
                <span
                  className={`shrink-0 font-bold ${
                    entry.type === "earn"
                      ? "text-signature-dark"
                      : "text-rose-600"
                  }`}
                >
                  {entry.type === "earn" ? "+" : "-"}
                  {entry.amount}P
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
