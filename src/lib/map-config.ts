export const NAVER_MAP_CLIENT_ID =
  process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? "";

/** .env.local에 NEXT_PUBLIC_USE_NAVER_MAP=true + Client ID 설정 시 네이버 지도 사용 */
export const USE_NAVER_MAP =
  process.env.NEXT_PUBLIC_USE_NAVER_MAP === "true" &&
  NAVER_MAP_CLIENT_ID.length > 0;

export function getMapTileProvider(): "naver" | "openstreetmap" {
  return USE_NAVER_MAP ? "naver" : "openstreetmap";
}
