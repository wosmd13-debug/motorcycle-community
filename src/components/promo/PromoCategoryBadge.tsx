import { promoCategoryMeta, type PromoCategory } from "@/lib/promo";

export default function PromoCategoryBadge({
  category,
  size = "sm",
}: {
  category: PromoCategory;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs";

  const categoryBadgeClass: Partial<Record<PromoCategory, string>> = {
    세차장: "bg-sky-100 text-sky-800 ring-sky-200",
  };

  return (
    <span
      className={`inline-flex items-center font-semibold ring-1 ${categoryBadgeClass[category] ?? "bg-signature-muted text-signature-darker ring-signature/30"} ${sizeClass}`}
      title={promoCategoryMeta[category].description}
    >
      {category}
    </span>
  );
}
