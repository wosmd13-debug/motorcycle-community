"use client";

import { useEffect, useState } from "react";

export default function MapAccessNotice() {
  const [hostname, setHostname] = useState<string | null>(null);

  useEffect(() => {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      setHostname(host);
    }
  }, []);

  if (!hostname) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      현재 <strong>{hostname}</strong> 주소로 접속 중입니다. 네이버 지도는{" "}
      <strong>http://localhost:3000</strong> 으로 접속해야 정상 표시됩니다.
    </div>
  );
}
