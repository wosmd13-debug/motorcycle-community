import { NaverNavActionGroup } from "@/components/routes/NaverNavButton";
import {
  formatFuelDistance,
  formatFuelPrice,
  fuelProductLabels,
  type LiveFuelStation,
} from "@/lib/opinet-service";

type LiveFuelStationCardProps = {
  station: LiveFuelStation;
  selected?: boolean;
  onSelect?: (id: string) => void;
};

export default function LiveFuelStationCard({
  station,
  selected = false,
  onSelect,
}: LiveFuelStationCardProps) {
  return (
    <article
      className={`rounded-2xl border p-4 transition ${
        selected
          ? "border-signature bg-signature-light/50 ring-2 ring-signature/30"
          : "border-green-100 bg-green-50/50 hover:border-green-200"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect?.(station.id)}
        className="w-full min-h-[44px] text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-slate-800">{station.name}</h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-green-700 ring-1 ring-green-200">
                {station.brandLabel}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {fuelProductLabels[station.productCode]} · 약{" "}
              {formatFuelDistance(station.distanceM)}
            </p>
            {station.address && (
              <p className="mt-1 text-xs text-slate-400">{station.address}</p>
            )}
          </div>
          <p className="shrink-0 text-xl font-extrabold text-green-700">
            {formatFuelPrice(station.price)}
          </p>
        </div>
      </button>

      <div className="mt-4">
        <NaverNavActionGroup
          waypoints={[{ lat: station.lat, lng: station.lng, name: station.name }]}
          compact
        />
      </div>
    </article>
  );
}
