export async function waitForElementRef(
  getElement: () => HTMLElement | null,
  timeoutMs = 8000
): Promise<HTMLElement | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const element = getElement();
    if (element) return element;
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  return getElement();
}

export function waitForMapContainerSize(
  container: HTMLElement,
  timeoutMs = 8000
): Promise<boolean> {
  return new Promise((resolve) => {
    if (container.offsetWidth > 0 && container.offsetHeight > 0) {
      resolve(true);
      return;
    }

    const observer = new ResizeObserver(() => {
      if (container.offsetWidth > 0 && container.offsetHeight > 0) {
        observer.disconnect();
        resolve(true);
      }
    });

    observer.observe(container);

    window.setTimeout(() => {
      observer.disconnect();
      resolve(container.offsetWidth > 0 && container.offsetHeight > 0);
    }, timeoutMs);
  });
}

export function resetMapContainer(container: HTMLElement | null) {
  container?.replaceChildren();
}
