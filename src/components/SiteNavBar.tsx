"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  isNavGroupActive,
  isNavHrefActive,
  navGroups,
  type SiteNavGroup,
} from "@/lib/site-nav";

type SiteNavBarProps = {
  variant: "desktop" | "mobile";
};

type FlyoutPos = { top: number; left: number };

function ChildList({
  group,
  pathname,
  listClassName,
  onNavigate,
}: {
  group: SiteNavGroup;
  pathname: string;
  listClassName: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className={listClassName}>
      {group.children.map((child) => {
        const childActive = isNavHrefActive(pathname, child.href);
        return (
          <li key={`${group.id}-${child.href}-${child.label}`} role="none">
            <Link
              href={child.href}
              role="menuitem"
              className={`site-nav-child ${childActive ? "is-active" : ""}`}
              onClick={onNavigate}
            >
              <span className="site-nav-child-label">{child.label}</span>
              {child.description ? (
                <span className="site-nav-child-desc">{child.description}</span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function DesktopNavGroupItem({
  group,
  openId,
  setOpenId,
}: {
  group: SiteNavGroup;
  openId: string | null;
  setOpenId: (id: string | null) => void;
}) {
  const pathname = usePathname();
  const menuId = useId();
  const itemRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<FlyoutPos | null>(null);
  const open = openId === group.id;
  const active = isNavGroupActive(pathname, group);
  const hasChildren = group.children.length > 0;

  const placeAndOpen = () => {
    if (!hasChildren || !itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const width = 280;
    const left = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - width - 8
    );
    // 부모와 플라이아웃 사이 틈을 없애 마우스가 끊기지 않게 함
    setPos({ top: rect.bottom, left });
    setOpenId(group.id);
  };

  const close = () => {
    setOpenId(null);
    setPos(null);
  };

  useEffect(() => {
    if (!open) return;
    const sync = () => {
      if (!itemRef.current) return;
      const rect = itemRef.current.getBoundingClientRect();
      const width = 280;
      const left = Math.min(
        Math.max(8, rect.left),
        window.innerWidth - width - 8
      );
      setPos({ top: rect.bottom, left });
    };
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [open]);

  return (
    <div
      ref={itemRef}
      className={`site-nav-item ${open ? "is-open" : ""} ${
        active ? "is-active" : ""
      }`}
      onMouseEnter={placeAndOpen}
      onFocusCapture={placeAndOpen}
    >
      {hasChildren ? (
        <Link
          href={group.href ?? "#"}
          className={`site-nav-parent ${active ? "is-active" : ""} ${
            open ? "is-open" : ""
          }`}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={menuId}
          onClick={(event) => {
            // 첫 클릭은 목록 열기, 이미 열린 상태면 이동
            if (!open) {
              event.preventDefault();
              placeAndOpen();
            }
          }}
        >
          {group.label}
          <span className="site-nav-caret" aria-hidden>
            ▾
          </span>
        </Link>
      ) : (
        <Link
          href={group.href ?? "/"}
          className={`site-nav-parent ${active ? "is-active" : ""}`}
          onMouseEnter={() => setOpenId(null)}
        >
          {group.label}
        </Link>
      )}

      {hasChildren && open && pos ? (
        <div
          id={menuId}
          role="menu"
          aria-label={group.label}
          className="site-nav-flyout"
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="site-nav-dropdown-inner">
            {group.description ? (
              <p className="site-nav-dropdown-desc">{group.description}</p>
            ) : null}
            <ChildList
              group={group}
              pathname={pathname}
              listClassName="site-nav-dropdown-list"
              onNavigate={close}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function SiteNavBar({ variant }: SiteNavBarProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const pathname = usePathname();
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpenId(null);
  }, [pathname]);

  // 바깥 클릭 또는 Esc 전까지 하위 메뉴 유지
  useEffect(() => {
    if (!openId) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const root =
        variant === "mobile" ? wrapRef.current : desktopRef.current;
      if (root && !root.contains(target)) {
        setOpenId(null);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenId(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openId, variant]);

  const openGroup = navGroups.find((group) => group.id === openId) ?? null;

  if (variant === "mobile") {
    return (
      <div ref={wrapRef} className="site-nav-mobile-wrap">
        <div
          className="site-nav-bar site-nav-bar-mobile"
          aria-label="모바일 주요 메뉴"
        >
          {navGroups.map((group) => {
            const active = isNavGroupActive(pathname, group);
            const open = openId === group.id;
            const hasChildren = group.children.length > 0;
            return (
              <div
                key={`mobile-${group.id}`}
                className={`site-nav-item ${open ? "is-open" : ""}`}
              >
                {hasChildren ? (
                  <button
                    type="button"
                    className={`site-nav-parent ${active ? "is-active" : ""} ${
                      open ? "is-open" : ""
                    }`}
                    aria-expanded={open}
                    aria-haspopup="menu"
                    onClick={() => setOpenId(open ? null : group.id)}
                  >
                    {group.label}
                    <span className="site-nav-caret" aria-hidden>
                      ▾
                    </span>
                  </button>
                ) : (
                  <Link
                    href={group.href ?? "/"}
                    className={`site-nav-parent ${active ? "is-active" : ""}`}
                    onClick={() => setOpenId(null)}
                  >
                    {group.label}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {openGroup && openGroup.children.length > 0 ? (
          <div
            id={panelId}
            role="menu"
            className="site-nav-mobile-panel"
            aria-label={openGroup.label}
          >
            <div className="site-nav-mobile-panel-inner">
              {openGroup.description ? (
                <p className="site-nav-mobile-panel-desc">
                  {openGroup.description}
                </p>
              ) : null}
              <ChildList
                group={openGroup}
                pathname={pathname}
                listClassName="site-nav-mobile-panel-list"
                onNavigate={() => setOpenId(null)}
              />
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={desktopRef}
      className="site-nav-bar site-nav-bar-desktop"
      aria-label="주요 메뉴"
    >
      {navGroups.map((group) => (
        <DesktopNavGroupItem
          key={`desktop-${group.id}`}
          group={group}
          openId={openId}
          setOpenId={setOpenId}
        />
      ))}
    </div>
  );
}
