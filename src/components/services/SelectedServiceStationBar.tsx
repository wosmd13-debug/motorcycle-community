import { NaverNavActionGroup } from "@/components/routes/NaverNavButton";
import {
  formatFuelDistance,
  formatFuelPrice,
  fuelProductLabels,
  type LiveFuelStation,
} from "@/lib/opinet-service";
import { placeCategoryLabels, type RiderPlace } from "@/lib/places-data";

type SelectedServiceStationBarProps =
  | {
      mode: "live";
      station: LiveFuelStation;
      onClear: () => void;
    }
  | {
      mode: "curated";
      place: RiderPlace;
      onClear: () => void;
    };

export default function SelectedServiceStationBar(props: SelectedServiceStationBarProps) {
  if (props.mode === "live") {
    const { station, onClear } = props;

    return (
      <div className="portal-panel flex flex-wrap items-center justify-between gap-3 border-green-200 bg-green-50/80 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-green-700">선택한 주유소</p>
          <p className="mt-1 truncate font-bold text-slate-800">{station.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {station.brandLabel} · {fuelProductLabels[station.productCode]} ·{" "}
            {formatFuelPrice(station.price)} · 약 {formatFuelDistance(station.distanceM)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NaverNavActionGroup
            waypoints={[{ lat: station.lat, lng: station.lng, name: station.name }]}
            compact
          />
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            선택 해제
          </button>
        </div>
      </div>
    );
  }

  const { place, onClear } = props;

  return (
    <div className="portal-panel flex flex-wrap items-center justify-between gap-3 border-green-200 bg-green-50/80 p-4">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-green-700">선택한 주유소</p>
        <p className="mt-1 truncate font-bold text-slate-800">{place.name}</p>
        <p className="mt-1 text-xs text-slate-500">
          {placeCategoryLabels[place.category]} · {place.region} · {place.address}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <NaverNavActionGroup
          waypoints={[{ lat: place.lat, lng: place.lng, name: place.name }]}
          compact
        />
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          선택 해제
        </button>
      </div>
    </div>
  );
}
