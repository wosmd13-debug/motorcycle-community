import type { Map as LeafletMap } from "leaflet";
import { waitForMapContainerSize } from "@/lib/map-container";

type LeafletModule = typeof import("leaflet");

const CARTO_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";
const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export function addReliableTileLayer(L: LeafletModule, map: LeafletMap) {
  const primary = L.tileLayer(CARTO_URL, {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  });

  let fallback: ReturnType<typeof L.tileLayer> | null = null;

  primary.on("tileerror", () => {
    if (fallback) return;

    fallback = L.tileLayer(OSM_URL, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    });

    map.removeLayer(primary);
    fallback.addTo(map);
  });

  primary.addTo(map);
  return primary;
}

export async function bootstrapLeafletMap(
  L: LeafletModule,
  container: HTMLElement,
  options: Parameters<LeafletModule["map"]>[1]
): Promise<LeafletMap> {
  await waitForMapContainerSize(container, 8000);

  const map = L.map(container, {
    ...options,
    touchZoom: true,
    bounceAtZoomLimits: false,
    wheelDebounceTime: 40,
    zoomAnimation: true,
  });
  addReliableTileLayer(L, map);

  requestAnimationFrame(() => {
    map.invalidateSize();
    window.setTimeout(() => map.invalidateSize(), 300);
  });

  watchLeafletContainer(container, map);
  return map;
}

export function watchLeafletContainer(
  container: HTMLElement,
  map: LeafletMap,
  timeoutMs = 5000
) {
  const refresh = () => {
    map.invalidateSize();
  };

  if (container.offsetWidth > 0 && container.offsetHeight > 0) {
    requestAnimationFrame(refresh);
  }

  const observer = new ResizeObserver(() => {
    if (container.offsetWidth > 0 && container.offsetHeight > 0) {
      refresh();
    }
  });

  observer.observe(container);

  const interval = window.setInterval(refresh, 500);
  const timeout = window.setTimeout(() => {
    refresh();
    window.clearInterval(interval);
  }, timeoutMs);

  return () => {
    observer.disconnect();
    window.clearInterval(interval);
    window.clearTimeout(timeout);
  };
}
