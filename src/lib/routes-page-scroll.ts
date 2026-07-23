let isPinned = false;
let pinnedScrollY = 0;
let savedBodyPosition = "";
let savedBodyTop = "";
let savedBodyLeft = "";
let savedBodyRight = "";
let savedBodyWidth = "";
let releaseTimer: number | ReturnType<typeof setTimeout> | null = null;

function applyPinnedBodyStyles() {
  document.body.style.position = "fixed";
  document.body.style.top = `-${pinnedScrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

function clearPinnedBodyStyles() {
  document.body.style.position = savedBodyPosition;
  document.body.style.top = savedBodyTop;
  document.body.style.left = savedBodyLeft;
  document.body.style.right = savedBodyRight;
  document.body.style.width = savedBodyWidth;
}

export function restoreScrollPosition(y: number) {
  if (typeof window === "undefined") return;

  const apply = () => {
    window.scrollTo({ top: y, left: 0, behavior: "auto" });
  };

  apply();
  requestAnimationFrame(apply);
  queueMicrotask(apply);
  window.setTimeout(apply, 0);
  window.setTimeout(apply, 50);
  window.setTimeout(apply, 150);
  window.setTimeout(apply, 400);
}

export function beginRoutesScrollPin() {
  if (typeof window === "undefined") return;

  if (!isPinned) {
    pinnedScrollY = window.scrollY;
    savedBodyPosition = document.body.style.position;
    savedBodyTop = document.body.style.top;
    savedBodyLeft = document.body.style.left;
    savedBodyRight = document.body.style.right;
    savedBodyWidth = document.body.style.width;
    applyPinnedBodyStyles();
    isPinned = true;
  }
}

export function scheduleRoutesScrollRelease(holdMs = 600) {
  if (typeof window === "undefined") return;

  if (releaseTimer) {
    window.clearTimeout(releaseTimer);
  }

  releaseTimer = window.setTimeout(() => {
    releaseTimer = null;
    if (!isPinned) return;

    const y = pinnedScrollY;
    clearPinnedBodyStyles();
    isPinned = false;
    restoreScrollPosition(y);
  }, holdMs);
}

export function runWithRoutesScrollPin(action: () => void, holdMs = 600) {
  beginRoutesScrollPin();

  try {
    action();
  } finally {
    scheduleRoutesScrollRelease(holdMs);
  }
}

export function replaceRoutesOpenId(routeId: string) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  url.searchParams.set("id", routeId);
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}`
  );
}
