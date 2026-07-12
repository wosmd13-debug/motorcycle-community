import { katecToWgs84, wgs84ToKatec } from "@/lib/katec-coords";
import { buildDestinationNavLinkHtml } from "@/lib/naver-nav";

export type FuelProductCode = "B027" | "D047" | "B034";

export const fuelProductLabels: Record<FuelProductCode, string> = {
  B027: "휘발유",
  D047: "경유",
  B034: "고급휘발유",
};

export type FuelBrandCode =
  | "SKE"
  | "GSC"
  | "HDO"
  | "SOL"
  | "RTE"
  | "RTX"
  | "NHO"
  | "ETC"
  | "E1G"
  | "SKG"
  | string;

export const fuelBrandLabels: Record<string, string> = {
  SKE: "SK",
  GSC: "GS",
  HDO: "HD",
  SOL: "S-OIL",
  RTE: "알뜰",
  RTX: "고속도로알뜰",
  NHO: "NH",
  ETC: "자가",
  E1G: "E1",
  SKG: "SK가스",
};

export type LiveFuelStation = {
  id: string;
  name: string;
  brand: FuelBrandCode;
  brandLabel: string;
  price: number;
  distanceM: number;
  lat: number;
  lng: number;
  address?: string;
  productCode: FuelProductCode;
};

type OpinetOilRow = {
  UNI_ID?: string;
  POLL_DIV_CD?: string;
  OS_NM?: string;
  PRICE?: string | number;
  DISTANCE?: string | number;
  GIS_X_COOR?: string | number;
  GIS_Y_COOR?: string | number;
  VAN_ADR?: string;
  NEW_ADR?: string;
};

type OpinetAroundResponse = {
  RESULT?: {
    OIL?: OpinetOilRow | OpinetOilRow[];
  };
  OIL?: OpinetOilRow | OpinetOilRow[];
};

const OPINET_BASE = "https://www.opinet.co.kr/api/aroundAll.do";

const cache = new Map<string, { expiresAt: number; stations: LiveFuelStation[] }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

function normalizeOilRows(payload: OpinetAroundResponse): OpinetOilRow[] {
  const raw = payload.RESULT?.OIL ?? payload.OIL;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function parseStation(
  row: OpinetOilRow,
  productCode: FuelProductCode
): LiveFuelStation | null {
  const id = String(row.UNI_ID ?? "").trim();
  const name = String(row.OS_NM ?? "").trim();
  const price = Number(row.PRICE);
  const x = Number(row.GIS_X_COOR);
  const y = Number(row.GIS_Y_COOR);

  if (!id || !name || !Number.isFinite(price) || !Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  const { lat, lng } = katecToWgs84(x, y);
  const brand = String(row.POLL_DIV_CD ?? "ETC").trim();
  const address = String(row.NEW_ADR ?? row.VAN_ADR ?? "").trim() || undefined;

  return {
    id,
    name,
    brand,
    brandLabel: fuelBrandLabels[brand] ?? brand,
    price,
    distanceM: Number(row.DISTANCE ?? 0),
    lat,
    lng,
    address,
    productCode,
  };
}

export function isOpinetConfigured(): boolean {
  return Boolean(process.env.OPINET_API_KEY?.trim());
}

export type FetchNearbyFuelOptions = {
  lat: number;
  lng: number;
  radius?: number;
  productCode?: FuelProductCode;
  sort?: 1 | 2;
  fresh?: boolean;
};

export type FetchNearbyFuelResult =
  | { ok: true; stations: LiveFuelStation[]; cached: boolean }
  | { ok: false; error: string; status: number };

export async function fetchNearbyFuelStations(
  options: FetchNearbyFuelOptions
): Promise<FetchNearbyFuelResult> {
  const apiKey = process.env.OPINET_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      error: "OPINET API 키가 설정되지 않았습니다. .env.local에 OPINET_API_KEY를 추가해 주세요.",
      status: 503,
    };
  }

  const lat = options.lat;
  const lng = options.lng;
  const radius = Math.min(Math.max(options.radius ?? 3000, 500), 5000);
  const productCode = options.productCode ?? "B027";
  const sort = options.sort ?? 1;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, error: "올바른 위치 좌표가 필요합니다.", status: 400 };
  }

  const { x, y } = wgs84ToKatec(lat, lng);
  const cacheKey = `${x.toFixed(0)}:${y.toFixed(0)}:${radius}:${productCode}:${sort}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);

  if (!options.fresh && cached && cached.expiresAt > now) {
    return { ok: true, stations: cached.stations, cached: true };
  }

  const url = new URL(OPINET_BASE);
  url.searchParams.set("certkey", apiKey);
  url.searchParams.set("out", "json");
  url.searchParams.set("x", String(x));
  url.searchParams.set("y", String(y));
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("prodcd", productCode);
  url.searchParams.set("sort", String(sort));

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      return {
        ok: false,
        error: "OPINET 유가 정보를 불러오지 못했습니다.",
        status: 502,
      };
    }

    const payload = (await response.json()) as OpinetAroundResponse;
    const stations = normalizeOilRows(payload)
      .map((row) => parseStation(row, productCode))
      .filter((station): station is LiveFuelStation => station != null);

    cache.set(cacheKey, {
      expiresAt: now + CACHE_TTL_MS,
      stations,
    });

    return { ok: true, stations, cached: false };
  } catch {
    return {
      ok: false,
      error: "OPINET 유가 정보 요청에 실패했습니다.",
      status: 502,
    };
  }
}

export function formatFuelPrice(price: number): string {
  return `${price.toLocaleString("ko-KR")}원`;
}

export function formatFuelDistance(distanceM: number): string {
  if (distanceM < 1000) return `${Math.round(distanceM)}m`;
  return `${(distanceM / 1000).toFixed(1)}km`;
}

export function buildLiveFuelMarkerHtml(
  station: LiveFuelStation,
  selected = false
): string {
  const border = selected ? "#15803d" : "#16a34a";
  const scale = selected ? "1.08" : "1";
  const priceLabel = formatFuelPrice(station.price).replace("원", "");

  return `<div style="display:flex;flex-direction:column;align-items:center;transform:scale(${scale});touch-action:manipulation;">
    <div style="padding:3px 8px;border-radius:9999px;background:#fff;border:2px solid ${border};box-shadow:0 2px 10px rgba(0,0,0,.18);font-size:11px;font-weight:800;color:#15803d;white-space:nowrap;line-height:1.2;">${priceLabel}</div>
    <div style="margin-top:2px;width:8px;height:8px;border-radius:9999px;background:${border};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.2);"></div>
  </div>`;
}

export function buildLiveFuelInfoContent(station: LiveFuelStation): string {
  const address = station.address
    ? `<p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">${station.address}</p>`
    : "";

  return `
    <div style="padding:12px 14px;min-width:200px;max-width:260px;border-radius:12px;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,.12);font-family:sans-serif;">
      <strong style="font-size:14px;color:#1e293b;">${station.name}</strong>
      <p style="margin:6px 0 0;font-size:11px;color:#64748b;">${station.brandLabel} · ${fuelProductLabels[station.productCode]}</p>
      <p style="margin:8px 0 0;font-size:18px;font-weight:800;color:#15803d;">${formatFuelPrice(station.price)}</p>
      <p style="margin:4px 0 0;font-size:11px;color:#64748b;">약 ${formatFuelDistance(station.distanceM)}</p>
      ${address}
      ${buildDestinationNavLinkHtml({
        lat: station.lat,
        lng: station.lng,
        name: station.name,
      })}
    </div>
  `;
}
