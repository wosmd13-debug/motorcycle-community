let lockCount = 0;
let savedScrollY = 0;
let savedOverflow = "";
let savedPosition = "";
let savedTop = "";
let savedWidth = "";

export function lockBodyScroll() {
  if (typeof document === "undefined") return;

  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    savedOverflow = document.body.style.overflow;
    savedPosition = document.body.style.position;
    savedTop = document.body.style.top;
    savedWidth = document.body.style.width;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.width = "100%";
  }

  lockCount += 1;
}

export function unlockBodyScroll() {
  if (typeof document === "undefined") return;

  if (lockCount <= 0) return;

  lockCount -= 1;

  if (lockCount > 0) return;

  document.body.style.overflow = savedOverflow;
  document.body.style.position = savedPosition;
  document.body.style.top = savedTop;
  document.body.style.width = savedWidth;
  window.scrollTo(0, savedScrollY);
}

export function resetBodyScrollLock() {
  if (typeof document === "undefined") return;

  if (lockCount === 0) return;

  lockCount = 0;
  document.body.style.overflow = savedOverflow || "";
  document.body.style.position = savedPosition || "";
  document.body.style.top = savedTop || "";
  document.body.style.width = savedWidth || "";
  window.scrollTo(0, savedScrollY);
}
