"use client";

import {
  formatGarageDate,
  formatGarageKm,
  getReminderProgressPercent,
  getReminderStatusClass,
  getReminderStatusLabel,
  type MaintenanceReminder,
  type ServiceIntervalKey,
} from "@/lib/bike-garage";

export default function MaintenanceReminderPanel({
  reminders,
  onQuickRecord,
}: {
  reminders: MaintenanceReminder[];
  onQuickRecord?: (key: ServiceIntervalKey) => void;
}) {
  const dueCount = reminders.filter((item) => item.status === "due").length;
  const soonCount = reminders.filter((item) => item.status === "soon").length;
  const unknownCount = reminders.filter((item) => item.status === "unknown").length;

  return (
    <section className="portal-panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-stone-800">소모품 주기</h2>
          <p className="mt-1 text-xs text-stone-500">
            현재 주행거리 − 마지막 정비 km로 계산합니다.
            {dueCount > 0 && ` · 도래 ${dueCount}건`}
            {soonCount > 0 && ` · 임박 ${soonCount}건`}
            {unknownCount > 0 && ` · 기록 없음 ${unknownCount}건`}
            {dueCount === 0 && soonCount === 0 && unknownCount === 0 && " · 모두 양호"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {reminders.map((item) => {
          const progress = getReminderProgressPercent(item);
          const mileageMismatch =
            item.lastServiceKm != null && item.lastServiceKm > item.currentMileage;

          return (
            <article
              key={item.key}
              className={`rounded-2xl border p-4 ${getReminderStatusClass(item.status)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold">{item.label}</p>
                  <p className="mt-1 text-xs opacity-80">
                    {formatGarageKm(item.intervalKm)}마다 {item.actionLabel}
                  </p>
                </div>
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold">
                  {getReminderStatusLabel(item.status, item.actionLabel)}
                </span>
              </div>

              {item.status === "unknown" ? (
                <p className="mt-3 text-sm font-semibold">
                  마지막 정비 km가 없어 주기를 계산할 수 없습니다.
                </p>
              ) : (
                <>
                  <p className="mt-3 text-lg font-bold leading-none">
                    {item.remainingKm != null && item.remainingKm > 0
                      ? `${formatGarageKm(item.remainingKm)} 남음`
                      : `${formatGarageKm(Math.abs(item.remainingKm ?? 0))} 초과`}
                  </p>
                  <p className="mt-2 text-xs opacity-80">
                    다음 {item.actionLabel}{" "}
                    {item.nextServiceKm != null ? formatGarageKm(item.nextServiceKm) : "-"}
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/60">
                    <div
                      className={`h-full rounded-full ${
                        item.status === "due"
                          ? "bg-red-500"
                          : item.status === "soon"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs opacity-75">
                    마지막{" "}
                    {item.lastServiceKm != null ? formatGarageKm(item.lastServiceKm) : "-"}
                    {item.lastServiceDate ? ` · ${formatGarageDate(item.lastServiceDate)}` : ""}
                    {item.source === "log" ? " · 일지" : item.source === "manual" ? " · 직접 입력" : ""}
                    {" · "}현재 {formatGarageKm(item.currentMileage)}
                  </p>
                  {mileageMismatch && (
                    <p className="mt-2 text-xs font-semibold">
                      마지막 정비 km가 현재 주행거리보다 큽니다. 주행거리를 확인해 주세요.
                    </p>
                  )}
                </>
              )}

              {onQuickRecord && (
                <button
                  type="button"
                  onClick={() => onQuickRecord(item.key)}
                  className="mt-3 w-full rounded-xl bg-white/80 px-3 py-2 text-xs font-bold hover:bg-white"
                >
                  {item.label} 기록하기
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
