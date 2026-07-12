import PageLoadingSkeleton from "@/components/ui/PageLoadingSkeleton";

export default function RoutesLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-signature-muted" />
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-xl bg-signature-muted" />
          <div className="h-4 w-96 max-w-full rounded-lg bg-signature-light" />
        </div>
      </div>
      <div className="mt-8 h-12 rounded-2xl bg-signature-light" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 rounded-3xl bg-signature-light" />
          ))}
        </div>
        <div className="h-[420px] rounded-3xl bg-signature-light" />
      </div>
    </div>
  );
}
