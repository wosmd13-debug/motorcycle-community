type PageLoadingSkeletonProps = {
  titleWidth?: string;
  rows?: number;
};

export default function PageLoadingSkeleton({
  titleWidth = "w-48",
  rows = 4,
}: PageLoadingSkeletonProps) {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-signature-muted" />
        <div className="space-y-2">
          <div className={`h-7 rounded-xl bg-signature-muted ${titleWidth}`} />
          <div className="h-4 w-72 max-w-full rounded-lg bg-signature-light" />
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="h-12 rounded-2xl bg-signature-light" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-9 w-20 rounded-full bg-signature-light"
            />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="h-28 rounded-3xl border border-signature/15 bg-white"
          />
        ))}
      </div>
    </div>
  );
}
