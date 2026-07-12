"use client";

import type { RouteWaypoint } from "@/lib/routes-data";

type WaypointEditorProps = {
  waypoints: RouteWaypoint[];
  onChange: (waypoints: RouteWaypoint[]) => void;
};

export default function WaypointEditor({
  waypoints,
  onChange,
}: WaypointEditorProps) {
  const updateWaypoint = (index: number, patch: Partial<RouteWaypoint>) => {
    onChange(
      waypoints.map((waypoint, currentIndex) =>
        currentIndex === index ? { ...waypoint, ...patch } : waypoint
      )
    );
  };

  const removeWaypoint = (index: number) => {
    onChange(waypoints.filter((_, currentIndex) => currentIndex !== index));
  };

  const moveWaypoint = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= waypoints.length) return;
    const next = [...waypoints];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  if (waypoints.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-signature/30 bg-signature-light/60 px-4 py-6 text-center text-sm text-stone-500">
        아직 경유지가 없습니다. 지도를 클릭해 코스를 그려 주세요.
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {waypoints.map((waypoint, index) => (
        <li
          key={`${index}-${waypoint.lat}-${waypoint.lng}`}
          className="rounded-2xl border border-signature/20 bg-white p-3"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signature text-xs font-bold text-white">
              {index + 1}
            </span>
            <input
              value={waypoint.name}
              onChange={(event) =>
                updateWaypoint(index, { name: event.target.value })
              }
              className="min-w-0 flex-1 border-b border-transparent bg-transparent px-1 py-1 text-sm font-semibold text-stone-800 outline-none focus:border-signature"
            />
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => moveWaypoint(index, -1)}
                disabled={index === 0}
                className="rounded border border-stone-200 px-2 py-1 text-xs text-stone-500 disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveWaypoint(index, 1)}
                disabled={index === waypoints.length - 1}
                className="rounded border border-stone-200 px-2 py-1 text-xs text-stone-500 disabled:opacity-40"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeWaypoint(index)}
                className="rounded border border-red-200 px-2 py-1 text-xs text-red-600"
              >
                삭제
              </button>
            </div>
          </div>
          <input
            value={waypoint.note ?? ""}
            onChange={(event) =>
              updateWaypoint(index, { note: event.target.value })
            }
            placeholder="메모 (선택)"
            className="mt-2 w-full rounded-xl border border-signature/20 bg-signature-light/40 px-3 py-2 text-xs text-stone-600 outline-none focus:border-signature"
          />
          <p className="mt-1 text-[11px] text-stone-400">
            {waypoint.lat.toFixed(5)}, {waypoint.lng.toFixed(5)}
          </p>
        </li>
      ))}
    </ol>
  );
}
