import PageLoadingSkeleton from "@/components/ui/PageLoadingSkeleton";

export default function MapLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-signature-muted" />
        <div className="space-y-2">
          <div className="h-7 w-40 rounded-xl bg-signature-muted" />
          <div className="h-4 w-80 max-w-full rounded-lg bg-signature-light" />
        </div>
      </div>
      <div className="mt-8 h-[calc(100dvh-14rem)] min-h-[420px] rounded-3xl bg-signature-light" />
    </div>
  );
}
