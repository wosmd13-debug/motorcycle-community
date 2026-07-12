"use client";

import {
  getReminderStatusClass,
  getReminderStatusLabel,
  type MaintenanceReminder,
} from "@/lib/bike-garage";

export default function MaintenanceReminderPanel({
  reminders,
}: {
  reminders: MaintenanceReminder[];
}) {
  const urgentCount = reminders.filter(
    (item) => item.status === "due" || item.status === "soon"
  ).length;

  return (
    <section className="portal-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-stone-800">정비 주기 알림</h2>
          <p className="mt-1 text-xs text-stone-500">
            현재 주행거리 기준 · {urgentCount}건 점검 필요
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {reminders.map((item) => (
          <article
            key={item.key}
            className={`rounded-2xl border p-4 ${getReminderStatusClass(item.status)}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold">{item.label}</p>
                <p className="mt-1 text-xs opacity-80">
                  {item.intervalKm.toLocaleString()}km마다 교환
                </p>
              </div>
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold">
                {getReminderStatusLabel(item.status)}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold">
              {item.remainingKm > 0
                ? `${item.remainingKm.toLocaleString()}km 남음`
                : `${Math.abs(item.remainingKm).toLocaleString()}km 초과`}
            </p>
            <p className="mt-1 text-xs opacity-75">
              마지막 {item.lastServiceKm.toLocaleString()}km · 현재{" "}
              {item.currentMileage.toLocaleString()}km
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
