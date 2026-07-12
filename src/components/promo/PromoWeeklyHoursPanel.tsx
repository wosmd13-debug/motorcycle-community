import {
  WEEK_DAYS,
  WEEK_DAY_LABELS,
  formatDayOpenHours,
  hasWeeklyOpenHours,
  type WeeklyOpenHours,
} from "@/lib/rider-cafe-hours";

export default function PromoWeeklyHoursPanel({
  hours,
}: {
  hours: WeeklyOpenHours | undefined;
}) {
  if (!hasWeeklyOpenHours(hours)) return null;

  return (
    <div className="w-fit max-w-xs overflow-hidden rounded-2xl border border-signature/20 bg-white">
      <div className="grid grid-cols-[2.5rem_1fr] gap-x-3 gap-y-1 bg-signature-light/40 px-3 py-2 text-xs font-semibold text-stone-600">
        <span>요일</span>
        <span>영업시간</span>
      </div>
      {WEEK_DAYS.map((day) => (
        <div
          key={day}
          className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-t border-signature/10 px-3 py-2 text-sm"
        >
          <span className="font-bold text-stone-700">{WEEK_DAY_LABELS[day]}</span>
          <span
            className={
              hours![day].closed ? "text-stone-400" : "text-stone-700"
            }
          >
            {formatDayOpenHours(hours![day])}
          </span>
        </div>
      ))}
    </div>
  );
}
