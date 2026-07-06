import type { BariRoute } from "@/lib/routes-data";
import { getPlaceCountForRoute } from "@/lib/places-data";

type RouteCardProps = {
  route: BariRoute;
  isSelected: boolean;
  onSelect: () => void;
};

const difficultyColor: Record<BariRoute["difficulty"], string> = {
  초급: "bg-emerald-100 text-emerald-700",
  중급: "bg-amber-100 text-amber-700",
  상급: "bg-rose-100 text-rose-700",
};

export default function RouteCard({ route, isSelected, onSelect }: RouteCardProps) {
  const placeCount = getPlaceCountForRoute(route.id);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-3xl border p-5 text-left shadow-sm transition ${
        isSelected
          ? "border-orange-300 bg-orange-50 ring-2 ring-orange-200"
          : "border-orange-100 bg-white hover:border-orange-200"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-600">
          {route.type}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${difficultyColor[route.difficulty]}`}
        >
          {route.difficulty}
        </span>
        <span className="text-xs text-slate-400">{route.region}</span>
      </div>

      <h3 className="mt-3 text-lg font-bold text-slate-800">{route.name}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
        {route.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>📏 {route.distance}</span>
        <span>⏱ {route.duration}</span>
        <span>
          ⭐ {route.rating} ({route.reviewCount})
        </span>
        {placeCount > 0 && <span>☕ 스팟 {placeCount}곳</span>}
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {route.startPoint} → {route.endPoint}
      </p>
    </button>
  );
}
