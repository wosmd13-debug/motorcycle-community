import {
  formatFuelDistance,
  formatFuelPrice,
  fuelProductLabels,
  type LiveFuelStation,
} from "@/lib/opinet-service";
import { openNaverNavigation } from "@/lib/naver-nav";
import { placeCategoryLabels, type RiderPlace } from "@/lib/places-data";
import type { RouteWaypoint } from "@/lib/routes-data";

const NAV_BTN_STYLE =
  "display:inline-flex;align-items:center;justify-content:center;flex:1;min-height:44px;padding:8px 12px;border-radius:9999px;font-size:12px;font-weight:700;border:none;cursor:pointer;touch-action:manipulation;";

function attachNavButtons(container: HTMLElement, waypoint: RouteWaypoint) {
  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.gap = "6px";
  row.style.marginTop = "10px";

  const navBtn = document.createElement("button");
  navBtn.type = "button";
  navBtn.textContent = "네이버 내비 시작";
  navBtn.style.cssText = `${NAV_BTN_STYLE}background:#03c75a;color:#fff;`;
  navBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openNaverNavigation([waypoint], "navigation");
  });

  const routeBtn = document.createElement("button");
  routeBtn.type = "button";
  routeBtn.textContent = "경로 미리보기";
  routeBtn.style.cssText = `${NAV_BTN_STYLE}background:#fff;color:#334155;border:1px solid #e2e8f0;`;
  routeBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openNaverNavigation([waypoint], "route");
  });

  row.append(navBtn, routeBtn);
  container.appendChild(row);
}

export function buildLiveFuelInfoElement(station: LiveFuelStation): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText =
    "padding:12px 14px;min-width:200px;max-width:260px;border-radius:12px;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,.12);font-family:sans-serif;touch-action:manipulation;";

  const title = document.createElement("strong");
  title.style.cssText = "font-size:14px;color:#1e293b;";
  title.textContent = station.name;

  const meta = document.createElement("p");
  meta.style.cssText = "margin:6px 0 0;font-size:11px;color:#64748b;";
  meta.textContent = `${station.brandLabel} · ${fuelProductLabels[station.productCode]}`;

  const price = document.createElement("p");
  price.style.cssText = "margin:8px 0 0;font-size:18px;font-weight:800;color:#15803d;";
  price.textContent = formatFuelPrice(station.price);

  const distance = document.createElement("p");
  distance.style.cssText = "margin:4px 0 0;font-size:11px;color:#64748b;";
  distance.textContent = `약 ${formatFuelDistance(station.distanceM)}`;

  wrapper.append(title, meta, price, distance);

  if (station.address) {
    const address = document.createElement("p");
    address.style.cssText = "margin:4px 0 0;font-size:11px;color:#94a3b8;";
    address.textContent = station.address;
    wrapper.appendChild(address);
  }

  attachNavButtons(wrapper, {
    lat: station.lat,
    lng: station.lng,
    name: station.name,
  });

  return wrapper;
}

export function buildServiceInfoElement(place: RiderPlace): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText =
    "padding:12px 14px;min-width:200px;max-width:260px;border-radius:12px;background:#fff;box-shadow:0 4px 12px rgba(0,0,0,.12);font-family:sans-serif;touch-action:manipulation;";

  wrapper.innerHTML = `
    <strong style="font-size:14px;color:#1e293b;">${place.name}</strong>
    <p style="margin:6px 0 0;font-size:11px;color:#64748b;">${placeCategoryLabels[place.category]} · ${place.region}</p>
    <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">${place.address}</p>
    ${
      place.openHours
        ? `<p style="margin:6px 0 0;font-size:11px;font-weight:600;color:#16a34a;">${place.openHours}</p>`
        : ""
    }
  `;

  attachNavButtons(wrapper, {
    lat: place.lat,
    lng: place.lng,
    name: place.name,
  });

  return wrapper;
}
