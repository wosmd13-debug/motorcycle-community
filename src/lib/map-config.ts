export const NAVER_MAP_CLIENT_ID =
  process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? "";

/**
 * Client ID가 있으면 네이버 지도 사용 (명시적으로 false일 때만 비활성화)
 * .env.local: NEXT_PUBLIC_NAVER_MAP_CLIENT_ID + NAVER_MAP_CLIENT_SECRET
 */
export const USE_NAVER_MAP =
  NAVER_MAP_CLIENT_ID.length > 0 &&
  process.env.NEXT_PUBLIC_USE_NAVER_MAP !== "false";

export function getMapTileProvider(): "naver" | "openstreetmap" {
  return USE_NAVER_MAP ? "naver" : "openstreetmap";
}
