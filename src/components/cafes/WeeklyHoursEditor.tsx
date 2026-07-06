"use client";

import {
  WEEK_DAYS,
  WEEK_DAY_LABELS,
  applyWeeklyHoursToAllDays,
  type WeekDay,
  type WeeklyOpenHours,
} from "@/lib/rider-cafe-hours";

type WeeklyHoursEditorProps = {
  value: WeeklyOpenHours;
  onChange: (hours: WeeklyOpenHours) => void;
};

export default function WeeklyHoursEditor({
  value,
  onChange,
}: WeeklyHoursEditorProps) {
  const updateDay = (day: WeekDay, patch: Partial<WeeklyOpenHours[WeekDay]>) => {
    onChange({
      ...value,
      [day]: { ...value[day], ...patch },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">요일별 영업시간</p>
        <button
          type="button"
          onClick={() => onChange(applyWeeklyHoursToAllDays(value, "mon"))}
          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-200 hover:bg-orange-50"
        >
          월요일 시간 → 전체 적용
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white">
        <div className="hidden grid-cols-[3rem_1fr_1fr_4rem] gap-2 bg-orange-50 px-3 py-2 text-xs font-semibold text-slate-600 sm:grid">
          <span>요일</span>
          <span>오픈</span>
          <span>마감</span>
          <span className="text-center">휴무</span>
        </div>

        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="grid grid-cols-1 gap-2 border-t border-orange-50 px-3 py-3 first:border-t-0 sm:grid-cols-[3rem_1fr_1fr_4rem] sm:items-center"
          >
            <span className="text-sm font-bold text-slate-700">
              {WEEK_DAY_LABELS[day]}
            </span>

            <label className="block sm:contents">
              <span className="mb-1 block text-[11px] text-slate-500 sm:hidden">
                오픈
              </span>
              <input
                type="time"
                value={value[day].open}
                disabled={value[day].closed}
                onChange={(event) => updateDay(day, { open: event.target.value })}
                className="w-full rounded-xl border border-orange-100 px-3 py-2 text-sm outline-none focus:border-orange-300 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </label>

            <label className="block sm:contents">
              <span className="mb-1 block text-[11px] text-slate-500 sm:hidden">
                마감
              </span>
              <input
                type="time"
                value={value[day].close}
                disabled={value[day].closed}
                onChange={(event) => updateDay(day, { close: event.target.value })}
                className="w-full rounded-xl border border-orange-100 px-3 py-2 text-sm outline-none focus:border-orange-300 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </label>

            <label className="flex items-center justify-start gap-2 sm:justify-center">
              <input
                type="checkbox"
                checked={value[day].closed}
                onChange={(event) =>
                  updateDay(day, { closed: event.target.checked })
                }
                className="h-4 w-4 rounded border-orange-200 text-orange-500 focus:ring-orange-300"
              />
              <span className="text-xs text-slate-600 sm:sr-only">휴무</span>
              <span className="text-xs text-slate-600 sm:hidden">휴무</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
