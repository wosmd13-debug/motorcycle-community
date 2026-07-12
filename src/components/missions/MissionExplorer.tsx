"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { MissionDashboard, MissionProgressView } from "@/lib/missions";

type MissionsResponse = {
  requiresAuth?: boolean;
  dashboard?: MissionDashboard | null;
  error?: string;
};

function formatRemain(iso: string, now: number): string {
  const diff = Math.max(0, new Date(iso).getTime() - now);
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}일 ${hours % 24}시간`;
  }
  return `${hours}시간 ${minutes}분`;
}

function ProgressRing({
  percent,
  size = 58,
  gradientId,
}: {
  percent: number;
  size?: number;
  gradientId: string;
}) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-stone-200 dark:text-stone-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-700 ease-out"
      />
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = Array.from({ length: 18 }, (_, i) => i);
  return (
    <div className="mission-confetti" aria-hidden>
      {pieces.map((i) => (
        <span
          key={i}
          className="mission-confetti-piece"
          style={
            {
              "--i": i,
              "--x": `${(i % 2 === 0 ? 1 : -1) * (20 + (i % 7) * 12)}px`,
              "--rot": `${(i * 37) % 360}deg`,
              background:
                i % 3 === 0 ? "#4ade80" : i % 3 === 1 ? "#fbbf24" : "#f97316",
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function MissionCard({
  item,
  busyId,
  onClaim,
  celebrateId,
}: {
  item: MissionProgressView;
  busyId: string | null;
  onClaim: (missionId: string) => void;
  celebrateId: string | null;
}) {
  const mission = item.definition;
  const busy = busyId === mission.id;
  const celebrating = celebrateId === mission.id;

  return (
    <article
      className={`mission-card relative overflow-hidden rounded-2xl border bg-[var(--surface)] p-4 transition duration-300 ${
        item.claimed
          ? "border-signature/40 bg-signature-light/40"
          : item.claimable
            ? "mission-card-ready border-signature shadow-[0_0_0_1px_rgba(34,197,94,0.18)]"
            : item.locked
              ? "border-[var(--border-default)] opacity-75"
              : "border-[var(--border-default)] hover:border-signature/30"
      } ${celebrating ? "mission-card-pop" : ""}`}
    >
      <ConfettiBurst active={celebrating} />
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${mission.accent} opacity-20 blur-2xl`}
      />

      <div className="relative flex gap-3">
        <div className="relative shrink-0">
          <ProgressRing
            percent={item.claimed ? 100 : item.percent}
            gradientId={`mission-ring-${mission.id}`}
          />
          <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-signature-dark">
            {mission.icon}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-[var(--text-primary)]">
                  {mission.title}
                </h3>
                {item.claimable && !item.claimed ? (
                  <span className="mission-ready-pill">보상 대기</span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {mission.description}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-signature-dark px-2.5 py-1 text-[11px] font-extrabold text-white">
              +{mission.points}P
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${mission.accent} transition-all duration-700`}
              style={{ width: `${item.claimed ? 100 : item.percent}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-[var(--text-faint)]">
            <span>
              {item.current}/{item.target}
              {item.locked && item.lockReason ? ` · ${item.lockReason}` : ""}
            </span>
            <span>{item.claimed ? "수령 완료" : `${item.percent}%`}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {item.claimed ? (
              <span className="inline-flex items-center rounded-full bg-signature-muted px-3 py-1.5 text-xs font-bold text-signature-darker">
                보상 수령 완료
              </span>
            ) : item.claimable || mission.action === "checkin" ? (
              <button
                type="button"
                disabled={busy || (mission.action !== "checkin" && !item.claimable)}
                onClick={() => onClaim(mission.id)}
                className="portal-btn mission-claim-btn px-3 py-1.5 text-xs disabled:opacity-60"
              >
                {busy
                  ? "처리 중..."
                  : mission.action === "checkin"
                    ? item.completed
                      ? "보상 받기"
                      : "출석하고 보상 받기"
                    : "보상 받기"}
              </button>
            ) : item.locked ? (
              <span className="inline-flex items-center rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-500 dark:border-stone-700">
                잠김
              </span>
            ) : mission.href ? (
              <Link
                href={mission.href}
                className="inline-flex items-center rounded-full border border-signature/30 bg-white px-3 py-1.5 text-xs font-semibold text-signature-dark hover:bg-signature-light dark:bg-[var(--surface-elevated)]"
              >
                {mission.cta ?? "바로가기"}
              </Link>
            ) : null}
          </div>
          <p className="mt-2 text-[11px] leading-5 text-[var(--text-muted)]">
            {mission.hint}
          </p>
        </div>
      </div>
    </article>
  );
}

type MissionExplorerProps = {
  initialDashboard: MissionDashboard | null;
  initialRequiresAuth: boolean;
};

export default function MissionExplorer({
  initialDashboard,
  initialRequiresAuth,
}: MissionExplorerProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [requiresAuth, setRequiresAuth] = useState(initialRequiresAuth);
  const [tab, setTab] = useState<"daily" | "weekly">("daily");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [celebrateId, setCelebrateId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/missions");
    const data = (await response.json()) as MissionsResponse;
    if (!response.ok) {
      throw new Error(data.error ?? "미션을 불러오지 못했습니다.");
    }
    setRequiresAuth(Boolean(data.requiresAuth));
    setDashboard(data.dashboard ?? null);
  }, []);

  useEffect(() => {
    if (!user) {
      setRequiresAuth(true);
      setDashboard(null);
      return;
    }
    void refresh().catch(() => undefined);
  }, [user, refresh]);

  const handleClaim = async (missionId: string) => {
    setBusyId(missionId);
    setError(null);
    try {
      const isCheckin = missionId === "daily_checkin";
      const response = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isCheckin
            ? { action: "checkin" }
            : { action: "claim", missionId }
        ),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "보상 수령에 실패했습니다.");
      }
      setDashboard(data.dashboard as MissionDashboard);
      setCelebrateId(missionId);
      setToast(
        data.claim
          ? `+${data.claim.points}P 획득!`
          : "출석이 반영되었습니다."
      );
      window.setTimeout(() => setCelebrateId(null), 1400);
      window.setTimeout(() => setToast(null), 2600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "보상 수령에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  };

  const list = useMemo(() => {
    if (!dashboard) return [];
    return tab === "daily" ? dashboard.daily : dashboard.weekly;
  }, [dashboard, tab]);

  const claimableList = useMemo(() => {
    if (!dashboard) return [];
    return [...dashboard.daily, ...dashboard.weekly].filter(
      (item) => item.claimable && !item.claimed
    );
  }, [dashboard]);

  const trackItems = useMemo(() => {
    if (!dashboard) return [];
    return (tab === "daily" ? dashboard.daily : dashboard.weekly).filter(
      (item) =>
        item.definition.id !== "daily_clear" &&
        item.definition.id !== "weekly_clear"
    );
  }, [dashboard, tab]);

  if (requiresAuth || !user) {
    return (
      <section className="portal-panel overflow-hidden">
        <div className="mission-hero relative overflow-hidden px-6 py-12 text-white sm:px-10">
          <div className="mission-hero-grid" aria-hidden />
          <div className="mission-hero-glow" aria-hidden />
          <div className="relative max-w-xl">
            <p className="text-xs font-bold tracking-[0.22em] text-signature-mid">
              DAILY RIDE MISSION
            </p>
            <h2 className="mission-hero-title mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              매일 타는 습관,
              <br />
              포인트로 돌아온다
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/85">
              출석·댓글·글쓰기·인증샷으로 일일/주간 미션을 깨고 랭킹 포인트를
              쌓아보세요. 스트릭이 이어질수록 보너스도 커집니다.
            </p>
            <Link
              href={`/login?next=${encodeURIComponent(pathname || "/missions")}`}
              className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-signature-darker shadow-lg"
            >
              로그인하고 미션 시작
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!dashboard) {
    return (
      <div className="portal-panel px-6 py-16 text-center text-sm text-stone-500">
        미션 보드를 불러오는 중...
      </div>
    );
  }

  const dailyRemain = formatRemain(dashboard.endsAt.daily, now);
  const weeklyRemain = formatRemain(dashboard.endsAt.weekly, now);
  const totalClaimable =
    dashboard.dailyClaimablePoints + dashboard.weeklyClaimablePoints;
  const trackDone = trackItems.filter(
    (item) => item.completed || item.claimed
  ).length;
  const trackPercent = Math.round(
    (trackDone / Math.max(trackItems.length, 1)) * 100
  );

  return (
    <div className="space-y-4">
      {toast && (
        <div className="mission-toast fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-bold text-white shadow-xl">
          {toast}
        </div>
      )}

      <section className="portal-panel overflow-hidden">
        <div className="mission-hero relative overflow-hidden px-5 py-8 text-white sm:px-8">
          <div className="mission-hero-grid" aria-hidden />
          <div className="mission-hero-glow" aria-hidden />

          <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-signature-mid">
                RIDE STREAK MISSION
              </p>
              <h2 className="mission-hero-title mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                오늘도 엔진 예열 완료
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-7 text-white/80">
                일일 미션을 깨고 주간 챔피언까지 노려보세요. 보상 포인트는 회원
                랭킹에 바로 반영됩니다.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="mission-stat-chip">
                  <p className="text-[10px] font-semibold text-white/70">연속 출석</p>
                  <p className="mt-1 text-2xl font-black text-amber-300">
                    {dashboard.streak}
                    <span className="ml-1 text-sm font-bold text-white/80">일</span>
                  </p>
                </div>
                <div className="mission-stat-chip">
                  <p className="text-[10px] font-semibold text-white/70">최장 스트릭</p>
                  <p className="mt-1 text-2xl font-black">
                    {dashboard.longestStreak}
                    <span className="ml-1 text-sm font-bold text-white/80">일</span>
                  </p>
                </div>
                <div className="mission-stat-chip">
                  <p className="text-[10px] font-semibold text-white/70">미션 누적</p>
                  <p className="mt-1 text-2xl font-black text-signature-mid">
                    {dashboard.totalEarnedPoints.toLocaleString("ko-KR")}
                    <span className="ml-1 text-sm font-bold text-white/80">P</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="mission-panel-card">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-signature-mid">오늘 일일 미션</p>
                  <span className="text-[11px] text-white/60">리셋 {dailyRemain}</span>
                </div>
                <p className="mt-2 text-xl font-black">
                  {dashboard.dailyCompletedCount}/{dashboard.daily.length}
                </p>
                <p className="mt-1 text-xs text-white/70">
                  받을 수 있는 보상{" "}
                  <strong className="text-white">
                    {dashboard.dailyClaimablePoints}P
                  </strong>
                </p>
              </div>
              <div className="mission-panel-card">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-amber-300">
                    {dashboard.weekLabel}
                  </p>
                  <span className="text-[11px] text-white/60">리셋 {weeklyRemain}</span>
                </div>
                <p className="mt-2 text-xl font-black">
                  {dashboard.weeklyCompletedCount}/{dashboard.weekly.length}
                </p>
                <p className="mt-1 text-xs text-white/70">
                  받을 수 있는 보상{" "}
                  <strong className="text-white">
                    {dashboard.weeklyClaimablePoints}P
                  </strong>
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-6">
            <div className="mb-2 flex items-center justify-between text-[11px] text-white/70">
              <span className="font-semibold">이번 주 출석 트랙</span>
              <span>
                {dashboard.weekDays.filter((d) => d.checked).length}/7일
              </span>
            </div>
            <div className="mission-week-track">
              {dashboard.weekDays.map((day) => (
                <div
                  key={day.dateKey}
                  className={`mission-week-day ${day.checked ? "is-checked" : ""} ${
                    day.isToday ? "is-today" : ""
                  }`}
                >
                  <span className="mission-week-dot" />
                  <span className="text-[10px] font-bold">{day.weekday}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {totalClaimable > 0 ? (
        <section className="mission-claim-banner portal-panel flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-signature-darker">
              지금 받을 수 있는 보상 {totalClaimable}P
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {claimableList
                .slice(0, 3)
                .map((item) => item.definition.title)
                .join(" · ")}
              {claimableList.length > 3 ? " 외" : ""}
            </p>
          </div>
          <button
            type="button"
            disabled={Boolean(busyId) || claimableList.length === 0}
            onClick={() => {
              const first = claimableList[0];
              if (first) void handleClaim(first.definition.id);
            }}
            className="portal-btn shrink-0 px-4 py-2 text-xs"
          >
            바로 수령
          </button>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTab("daily")}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            tab === "daily"
              ? "bg-signature-dark text-white"
              : "bg-[var(--surface)] text-[var(--text-secondary)] ring-1 ring-[var(--border-default)]"
          }`}
        >
          일일 미션
        </button>
        <button
          type="button"
          onClick={() => setTab("weekly")}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            tab === "weekly"
              ? "bg-signature-dark text-white"
              : "bg-[var(--surface)] text-[var(--text-secondary)] ring-1 ring-[var(--border-default)]"
          }`}
        >
          주간 미션
        </button>
        <Link
          href="/ranking"
          className="ml-auto text-xs font-semibold text-signature-dark hover:underline"
        >
          랭킹에서 포인트 확인 →
        </Link>
      </div>

      <section className="portal-panel px-4 py-4 sm:px-5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-bold text-[var(--text-primary)]">
            {tab === "daily" ? "오늘의 라이딩 코스" : "주간 챔피언 코스"}
          </span>
          <span className="font-semibold text-signature-dark">{trackPercent}%</span>
        </div>
        <div className="mission-course-rail">
          <div
            className="mission-course-fill"
            style={{ width: `${trackPercent}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {trackItems.map((item, index) => {
            const done = item.completed || item.claimed;
            return (
              <div
                key={item.definition.id}
                className={`mission-course-node ${done ? "is-done" : ""} ${
                  item.claimable ? "is-ready" : ""
                }`}
                title={item.definition.title}
              >
                <span className="text-[10px] font-black">{index + 1}</span>
                <span className="truncate text-[10px] font-semibold">
                  {item.definition.title}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40">
          {error}
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {list.map((item) => (
          <MissionCard
            key={item.definition.id}
            item={item}
            busyId={busyId}
            onClaim={handleClaim}
            celebrateId={celebrateId}
          />
        ))}
      </div>
    </div>
  );
}
