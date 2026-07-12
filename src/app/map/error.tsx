"use client";

export default function MapPageError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[420px] max-w-6xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-lg font-bold text-slate-800">지도 페이지를 불러오지 못했습니다</p>
      <p className="max-w-md text-sm leading-6 text-slate-500">
        네이버 지도 초기화 중 오류가 발생했습니다. 새로고침하거나 잠시 후 다시
        시도해 주세요.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-signature-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-signature-darker"
      >
        다시 시도
      </button>
    </div>
  );
}
