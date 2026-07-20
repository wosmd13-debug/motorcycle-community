"use client";

import { useEffect, useMemo, useState } from "react";
import { NAVER_MAP_CLIENT_ID, USE_NAVER_MAP } from "@/lib/map-config";

function buildSuggestedUrls(origin: string | null) {
  const urls = new Set([
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:3000",
    "https://byanra.com",
    "https://www.byanra.com",
  ]);

  if (origin) {
    urls.add(origin);
    try {
      const parsed = new URL(origin);
      if (parsed.hostname && parsed.hostname !== "localhost") {
        urls.add(`http://${parsed.hostname}`);
        if (parsed.port) {
          urls.add(`http://${parsed.hostname}:${parsed.port}`);
        }
      }
    } catch {
      // ignore invalid origin
    }
  }

  return [...urls];
}

export default function NaverMapSetupGuide() {
  const [origin, setOrigin] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const suggestedUrls = useMemo(() => buildSuggestedUrls(origin), [origin]);

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  if (!USE_NAVER_MAP) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
        <p className="font-bold">네이버 지도 Client ID가 필요합니다</p>
        <p className="mt-2 leading-6 text-amber-900">
          <code className="rounded bg-white px-1">.env.local</code> (개발) 또는{" "}
          <code className="rounded bg-white px-1">.env.production</code> (서버)에{" "}
          <code className="rounded bg-white px-1">
            NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
          </code>
          와 <code className="rounded bg-white px-1">NAVER_MAP_CLIENT_SECRET</code>
          을 설정한 뒤 서버를 재시작하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
      <p className="font-bold">네이버 지도 인증 설정이 필요합니다</p>
      <p className="mt-2 leading-6 text-amber-900">
        경로 API(Directions)는 동작해도 <strong>브라우저 지도 타일</strong>은 Web
        서비스 URL과 Dynamic Map 설정이 맞아야 표시됩니다. SDK는{" "}
        <code className="rounded bg-white px-1">ncpKeyId</code> 파라미터를
        사용합니다.
      </p>

      {origin && (
        <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-xs leading-6 text-amber-900">
          현재 접속 주소:{" "}
          <code className="rounded bg-white px-1">{origin}</code>
          {origin.includes("192.168.") || origin.includes("10.") ? (
            <>
              {" "}
              — 휴대폰/LAN IP 접속입니다. 아래 목록에 이 주소도 NCP에 등록해야
              합니다.
            </>
          ) : null}
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
          <strong>API 선택</strong> → <strong>Dynamic Map(Web)</strong> 체크 후
          저장
        </li>
        <li>
          <strong>Application 등록</strong> → <strong>Web 서비스 URL</strong>에
          아래 주소를 등록 (공식 가이드: 포트·경로 없이 호스트만, 안 되면 포트
          포함도 시도)
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
          인증정보의 Client ID가{" "}
          <code className="rounded bg-white px-1">
            {NAVER_MAP_CLIENT_ID.slice(0, 4)}***
          </code>
          와 같은 Application인지 확인
        </li>
        <li>
          저장 후 1~2분 뒤{" "}
          <a
            href="/naver-map-test.html"
            className="font-semibold text-signature-dark underline"
          >
            /naver-map-test.html
          </a>
          에서 인증 성공 여부 확인
        </li>
      </ol>

      <p className="mt-3 text-xs text-amber-800">
        PC 개발: <code className="rounded bg-white px-1">http://localhost:3000</code>
        으로 접속하세요. IP 주소·등록되지 않은 https 도메인으로 접속하면 인증이
        실패할 수 있습니다.
      </p>
    </div>
  );
}
