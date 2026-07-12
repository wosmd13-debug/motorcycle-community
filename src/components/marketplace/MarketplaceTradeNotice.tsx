import { marketplaceTradeNotice } from "@/lib/marketplace";

type MarketplaceTradeNoticeProps = {
  compact?: boolean;
};

export default function MarketplaceTradeNotice({
  compact = false,
}: MarketplaceTradeNoticeProps) {
  const { title, summary, privacyWarning, prohibited, footer } = marketplaceTradeNotice;

  if (compact) {
    return (
      <div className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
        <p className="font-bold">{title}</p>
        <p className="mt-1">직거래·택배는 판매자와 구매자가 직접 협의합니다.</p>
        <p className="mt-1 font-semibold text-red-700">{privacyWarning}</p>
      </div>
    );
  }

  return (
    <section className="portal-panel overflow-hidden border-amber-200">
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center bg-amber-500 text-xs font-bold text-white">
            ₩
          </span>
          <h2 className="text-sm font-bold text-amber-900">{title}</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-amber-900">{summary}</p>
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold leading-5 text-red-800">
          {privacyWarning}
        </p>
      </div>
      <div className="bg-white px-4 py-3">
        <p className="text-xs font-bold text-stone-700">주의사항</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-5 text-stone-600">
          {prohibited.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 border-t border-amber-100 pt-3 text-xs leading-5 text-amber-800">
          {footer}
        </p>
      </div>
    </section>
  );
}
