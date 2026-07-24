"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import HeaderSearch from "@/components/HeaderSearch";
import AuthNavActions from "@/components/auth/AuthNavActions";
import SiteNavBar from "@/components/SiteNavBar";
import ThemeToggle from "@/components/theme/ThemeToggle";
import {
  isNavGroupActive,
  isNavHrefActive,
  navGroups,
} from "@/lib/site-nav";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setMenuOpen(false);
    setExpandedId(null);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full overflow-visible border-b-2 border-signature bg-[var(--header-bg)] shadow-sm safe-top">
      <div className="portal-container flex flex-wrap items-center gap-x-2 gap-y-2 py-2 sm:gap-4 sm:py-3">
        <Link href="/" className="group min-w-0 shrink-0" aria-label={`${SITE_NAME} 홈`}>
          <p className="text-lg font-bold tracking-tight text-signature sm:text-xl">
            {SITE_NAME}
          </p>
          <p className="text-[10px] font-medium text-[var(--text-muted)] group-hover:text-signature-dark sm:text-[11px]">
            {SITE_TAGLINE}
          </p>
        </Link>

        <div className="site-header-desktop-only hidden min-w-0 flex-1 lg:block [&_form]:max-w-md">
          <HeaderSearch />
        </div>

        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-2">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="site-all-menus"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-signature/30 bg-signature-light px-2.5 py-1.5 text-[11px] font-bold text-signature-darker lg:hidden"
          >
            {menuOpen ? "닫기" : "전체 메뉴"}
          </button>

          <div className="site-header-touch-only shrink-0 lg:hidden">
            <ThemeToggle />
          </div>

          <div className="site-header-touch-only min-w-0 flex-1 basis-0 lg:hidden">
            <AuthNavActions compact />
          </div>

          <div className="site-header-desktop-only hidden shrink-0 lg:block">
            <AuthNavActions />
          </div>
        </div>
      </div>

      <div className="site-header-touch-only border-t border-signature/15 bg-[var(--header-bg)] lg:hidden">
        <div className="portal-container py-2">
          <HeaderSearch />
        </div>
      </div>

      {menuOpen ? (
        <div
          id="site-all-menus"
          className="site-all-menus border-t border-signature/20 bg-[var(--surface)] lg:hidden"
        >
          <div className="portal-container space-y-2.5 py-3.5">
            <div className="flex items-end justify-between gap-2 px-0.5">
              <div>
                <p className="text-[11px] font-bold tracking-wide text-[var(--text-faint)]">
                  전체 메뉴
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  부모 메뉴를 펼쳐 하위 게시판으로 이동하세요
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="shrink-0 rounded-full border border-signature/20 px-2.5 py-1 text-[11px] font-bold text-signature-darker"
              >
                닫기
              </button>
            </div>
            {navGroups.map((group) => {
              const groupActive = isNavGroupActive(pathname, group);
              const expanded = expandedId === group.id;
              const hasChildren = group.children.length > 0;

              return (
                <div
                  key={`sheet-${group.id}`}
                  className="overflow-hidden rounded-2xl border border-signature/20 bg-[var(--surface)] shadow-sm"
                >
                  <div className="flex items-stretch">
                    {group.href ? (
                      <Link
                        href={group.href}
                        className={`min-w-0 flex-1 px-3.5 py-3 text-sm font-bold ${
                          groupActive
                            ? "bg-signature-dark text-white"
                            : "text-[var(--text-primary)]"
                        }`}
                      >
                        {group.label}
                        {group.description ? (
                          <span
                            className={`mt-0.5 block text-[11px] font-medium ${
                              groupActive
                                ? "text-white/75"
                                : "text-[var(--text-muted)]"
                            }`}
                          >
                            {group.description}
                          </span>
                        ) : null}
                      </Link>
                    ) : (
                      <span className="min-w-0 flex-1 px-3.5 py-3 text-sm font-bold">
                        {group.label}
                      </span>
                    )}
                    {hasChildren ? (
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-label={`${group.label} 하위 메뉴`}
                        onClick={() =>
                          setExpandedId(expanded ? null : group.id)
                        }
                        className={`shrink-0 border-l border-signature/15 px-3.5 text-sm font-bold ${
                          groupActive
                            ? "bg-signature-darker text-white"
                            : "bg-signature-light text-signature-darker"
                        }`}
                      >
                        {expanded ? "▴" : "▾"}
                      </button>
                    ) : null}
                  </div>
                  {hasChildren && expanded ? (
                    <ul className="grid grid-cols-1 divide-y divide-[var(--border-subtle)] border-t border-signature/10 bg-[var(--surface-subtle,var(--signature-light))] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                      {group.children.map((child) => {
                        const childActive = isNavHrefActive(
                          pathname,
                          child.href
                        );
                        return (
                          <li
                            key={`sheet-child-${group.id}-${child.href}-${child.label}`}
                          >
                            <Link
                              href={child.href}
                              className={`block px-3.5 py-3 ${
                                childActive
                                  ? "bg-signature-muted/70"
                                  : "active:bg-signature-light/70"
                              }`}
                            >
                              <span className="text-sm font-semibold text-[var(--text-primary)]">
                                {child.label}
                              </span>
                              {child.description ? (
                                <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-muted)]">
                                  {child.description}
                                </span>
                              ) : null}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <nav
        id="mobile-site-nav"
        aria-label="주요 메뉴"
        className="site-nav-touch border-t border-signature/20 bg-gradient-to-r from-signature-dark via-signature to-signature-darker lg:hidden"
      >
        <SiteNavBar variant="mobile" />
      </nav>

      <nav className="site-nav-desktop relative z-[60] hidden overflow-visible bg-gradient-to-r from-signature-dark via-signature to-signature-darker lg:block">
        <div className="portal-container overflow-visible">
          <SiteNavBar variant="desktop" />
        </div>
      </nav>
    </header>
  );
}
