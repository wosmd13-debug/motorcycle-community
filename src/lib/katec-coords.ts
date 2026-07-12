import proj4 from "proj4";

const WGS84 = "EPSG:4326";

// KATEC (EPSG:5174) — OPINET 좌표계
const KATEC =
  "+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +ellps=bessel +units=m +no_defs +towgs84=-145.907,505.034,685.756,-1.162,2.347,1.592,6.342";

export function wgs84ToKatec(lat: number, lng: number): { x: number; y: number } {
  const [x, y] = proj4(WGS84, KATEC, [lng, lat]);
  return { x, y };
}

export function katecToWgs84(x: number, y: number): { lat: number; lng: number } {
  const [lng, lat] = proj4(KATEC, WGS84, [x, y]);
  return { lat, lng };
}
