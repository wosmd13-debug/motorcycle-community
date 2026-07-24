import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import {
  breadcrumbJsonLd,
  type BreadcrumbItem,
} from "@/lib/seo";

type SiteBreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export default function SiteBreadcrumbs({
  items,
  className = "",
}: SiteBreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="breadcrumb"
      className={`text-xs text-[var(--text-muted)] ${className}`}
    >
      <JsonLd data={breadcrumbJsonLd(items)} />
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.name}-${index}`} className="inline-flex items-center gap-1.5">
              {index > 0 && (
                <span className="text-[var(--text-faint)]" aria-hidden>
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="font-medium text-signature-dark hover:underline"
                >
                  {item.name}
                </Link>
              ) : (
                <span
                  className={isLast ? "font-semibold text-[var(--text-secondary)]" : undefined}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.name}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
