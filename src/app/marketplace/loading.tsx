export default function MarketplaceLoading() {
  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <div className="h-24 animate-pulse rounded-3xl bg-signature-light" />
        <div className="h-40 animate-pulse rounded-3xl bg-signature-light" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-3xl bg-signature-light"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
