"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-slate-100">
        <div className="max-w-md space-y-4">
          <p className="text-lg font-bold">페이지를 불러오지 못했습니다</p>
          <p className="text-sm leading-6 text-slate-400">
            일시적인 오류입니다. 새로고침하면 대부분 해결됩니다.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-signature-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-signature-darker"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
