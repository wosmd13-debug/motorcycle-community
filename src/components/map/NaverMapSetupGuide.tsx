"use client";

import { useEffect, useMemo, useState } from "react";
import { NAVER_MAP_CLIENT_ID, USE_NAVER_MAP } from "@/lib/map-config";
import { buildNaverMapSuggestedUrls } from "@/lib/naver-map-domains";

type NaverStatus = {
  mapConfigured?: boolean;
  clientIdPreview?: string;
  secretConfigured?: boolean;
  directions?: "ok" | "failed" | "skipped";
  directionsError?: string | null;
  preferredSdkParam?: string;
  hints?: string[];
};

export default function NaverMapSetupGuide() {
  const [origin, setOrigin] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [status, setStatus] = useState<NaverStatus | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    void fetch("/api/naver/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: NaverStatus) => setStatus(data))
      .catch(() => setStatus(null));
  }, []);

  const suggestedUrls = useMemo(() => buildNaverMapSuggestedUrls(origin), [origin]);

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  if (!USE_NAVER_MAP && !status?.mapConfigured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
        <p className="font-bold">네이버 지도 Client ID가 필요합니다</p>
        <p className="mt-2 leading-6 text-amber-900">
          <code className="rounded bg-white px-1">.env.production</code>에{" "}
          <code className="rounded bg-white px-1">
            NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
          </code>
          와 <code className="rounded bg-white px-1">NAVER_MAP_CLIENT_SECRET</code>
          을 설정한 뒤 Docker 이미지를 다시 빌드하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
      <p className="font-bold">네이버 지도 · 경로 API 진단</p>

      {status && (
        <div className="mt-3 space-y-2 rounded-xl bg-white/80 px-3 py-3 text-xs leading-6 text-amber-900">
          <p>
            서버 Client ID:{" "}
            <code className="rounded bg-white px-1">
              {status.clientIdPreview || "없음"}
            </code>
            {" · "}
            Secret: {status.secretConfigured ? "설정됨" : "없음"}
          </p>
          <p>
            경로 API:{" "}
            {status.directions === "ok" ? (
              <strong className="text-green-700">정상</strong>
            ) : status.directions === "failed" ? (
              <strong className="text-red-700">실패</strong>
            ) : (
              "미설정"
            )}
            {status.directionsError ? ` — ${status.directionsError}` : ""}
          </p>
          <p>
            SDK 파라미터:{" "}
            <code className="rounded bg-white px-1">
              {status.preferredSdkParam || "ncpKeyId"}
            </code>
            (자동으로 ncpClientId도 시도)
          </p>
          {status.hints?.map((hint) => (
            <p key={hint}>• {hint}</p>
          ))}
        </div>
      )}

      <p className="mt-3 leading-6 text-amber-900">
        NCP 설정을 이미 했다면, 아래 6단계를 확인한 뒤{" "}
        <strong>자동 복구 시도</strong> 또는{" "}
        <a href="/naver-map-test.html" className="font-semibold underline">
          인증 테스트
        </a>
        를 실행하세요.
      </p>

      {origin && (
        <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-xs leading-6 text-amber-900">
          현재 접속 주소:{" "}
          <code className="rounded bg-white px-1">{origin}</code>
        </p>
      )}

      <ol className="mt-3 list-decimal space-y-1.5 pl-5 leading-6 text-amber-900">
        <li>
          <a
            href="https://console.ncloud.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-signature-dark underline"
          >
            네이버 클라우드 콘솔
          </a>
          {" → Application Services → Maps → Application"}
        </li>
        <li>
          <strong>API 선택</strong> → <strong>Dynamic Map(Web)</strong> +{" "}
          <strong>Directions 15</strong> 체크
        </li>
        <li>
          <strong>Web 서비스 URL</strong>에 아래 주소 등록 (호스트만 등록, 안 되면
          전체 URL도 시도)
        </li>
      </ol>

      <ul className="mt-2 space-y-1.5">
        {suggestedUrls.map((url) => (
          <li
            key={url}
            className="flex flex-wrap items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-xs"
          >
            <code className="break-all">{url}</code>
            <button
              type="button"
              onClick={() => void copyUrl(url)}
              className="min-h-[36px] shrink-0 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-amber-900 hover:bg-amber-50"
            >
              {copied === url ? "복사됨" : "복사"}
            </button>
          </li>
        ))}
      </ul>

      <ol className="mt-3 list-decimal space-y-1.5 pl-5 leading-6 text-amber-900" start={4}>
        <li>
          Client ID가{" "}
          <code className="rounded bg-white px-1">
            {(status?.clientIdPreview || NAVER_MAP_CLIENT_ID.slice(0, 4) + "***")}
          </code>
          와 같은 Application인지 확인
        </li>
        <li>
          저장 후{" "}
          <code className="rounded bg-white px-1">
            docker compose --env-file .env.production up -d --build
          </code>
        </li>
        <li>
          <a href="/naver-map-test.html" className="font-semibold underline">
            /naver-map-test.html
          </a>
          에서 인증 성공 확인
        </li>
      </ol>
    </div>
  );
}
