import {
  buildNaverMapsSdkUrl,
  resolveNaverMapsSdkParam,
  type NaverMapsSdkParam,
} from "@/lib/naver-maps";

export function resolveRuntimeNaverMapClientId(): string {
  return (
    process.env.NAVER_MAP_CLIENT_ID ??
    process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ??
    ""
  ).trim();
}

export function isRuntimeNaverMapEnabled(): boolean {
  const clientId = resolveRuntimeNaverMapClientId();
  return clientId.length > 0 && process.env.NEXT_PUBLIC_USE_NAVER_MAP !== "false";
}

export function buildRuntimeNaverMapConfig() {
  const clientId = resolveRuntimeNaverMapClientId();
  const preferred = resolveNaverMapsSdkParam();
  const sdkParams: NaverMapsSdkParam[] =
    preferred === "ncpClientId"
      ? ["ncpClientId", "ncpKeyId"]
      : ["ncpKeyId", "ncpClientId"];

  return {
    configured: isRuntimeNaverMapEnabled(),
    clientId,
    clientIdPreview: clientId ? `${clientId.slice(0, 4)}***` : "",
    preferredSdkParam: preferred,
    sdkParams,
    sdkUrls: sdkParams.map((param) => buildNaverMapsSdkUrl(clientId, param)),
    sdkUrl: clientId ? buildNaverMapsSdkUrl(clientId, preferred) : "",
  };
}
