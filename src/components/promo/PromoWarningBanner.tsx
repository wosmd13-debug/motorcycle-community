import { promoRulesNotice } from "@/lib/promo";

type PromoWarningBannerProps = {
  compact?: boolean;
};

export default function PromoWarningBanner({
  compact = false,
}: PromoWarningBannerProps) {
  const { title, summary, prohibited, footer } = promoRulesNotice;

  if (compact) {
    return (
      <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-900">
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-red-800">
          음란물·불법 촬영물·사기·허위광고·저작권 침해 등은 등록 불가합니다.
        </p>
      </div>
    );
  }

  return (
    <section className="portal-panel overflow-hidden border-red-200">
      <div className="border-b border-red-200 bg-red-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center bg-red-600 text-xs font-bold text-white">
            !
          </span>
          <h2 className="text-sm font-bold text-red-900">{title}</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-red-800">{summary}</p>
      </div>
      <div className="bg-white px-4 py-3">
        <p className="text-xs font-bold text-stone-700">등록 금지 콘텐츠</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-5 text-stone-600">
          {prohibited.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 border-t border-red-100 pt-3 text-xs leading-5 text-red-700">
          {footer}
        </p>
      </div>
    </section>
  );
}
