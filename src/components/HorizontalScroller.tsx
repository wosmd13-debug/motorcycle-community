"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type HorizontalScrollerProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** 어두운 배경(초록 내비)용 페이드 */
  tone?: "light" | "dark";
  ariaLabel?: string;
};

export default function HorizontalScroller({
  children,
  className = "",
  contentClassName = "",
  tone = "light",
  ariaLabel,
}: HorizontalScrollerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(max > 4 && el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    updateEdges();

    const onScroll = () => updateEdges();
    el.addEventListener("scroll", onScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => updateEdges());
    resizeObserver.observe(el);
    if (el.firstElementChild) {
      resizeObserver.observe(el.firstElementChild);
    }

    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges, children]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.min(280, Math.max(160, el.clientWidth * 0.65));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  const fadeClass =
    tone === "dark" ? "nav-scroller-fade-dark" : "nav-scroller-fade-light";

  return (
    <div className={`nav-scroller relative ${className}`}>
      {canLeft ? (
        <>
          <div
            className={`nav-scroller-fade nav-scroller-fade-left ${fadeClass}`}
            aria-hidden
          />
          <button
            type="button"
            aria-label="이전 메뉴"
            className={`nav-scroller-btn nav-scroller-btn-left ${
              tone === "dark" ? "is-dark" : "is-light"
            }`}
            onClick={() => scrollByDir(-1)}
          >
            ‹
          </button>
        </>
      ) : null}

      {canRight ? (
        <>
          <div
            className={`nav-scroller-fade nav-scroller-fade-right ${fadeClass}`}
            aria-hidden
          />
          <button
            type="button"
            aria-label="다음 메뉴"
            className={`nav-scroller-btn nav-scroller-btn-right ${
              tone === "dark" ? "is-dark" : "is-light"
            }`}
            onClick={() => scrollByDir(1)}
          >
            ›
          </button>
        </>
      ) : null}

      <div
        ref={scrollerRef}
        role="navigation"
        aria-label={ariaLabel}
        className="portal-scroll-x nav-scroller-track"
      >
        <div className={`nav-scroller-inner ${contentClassName}`}>
          {children}
          <span className="nav-scroller-end-spacer" aria-hidden />
        </div>
      </div>
    </div>
  );
}
