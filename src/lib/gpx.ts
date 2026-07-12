import type { RouteWaypoint } from "@/lib/routes-data";

export type GpxPoint = {
  lat: number;
  lng: number;
  name?: string;
  note?: string;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildGpxDocument(options: {
  name: string;
  description?: string;
  trackPoints: GpxPoint[];
  waypoints?: GpxPoint[];
}): string {
  const { name, description, trackPoints, waypoints = [] } = options;
  const safeName = escapeXml(name);
  const safeDescription = description ? escapeXml(description) : "";

  const trackXml = trackPoints
    .map(
      (point) =>
        `      <trkpt lat="${point.lat.toFixed(6)}" lon="${point.lng.toFixed(6)}"></trkpt>`
    )
    .join("\n");

  const waypointXml = waypoints
    .map((point) => {
      const lines = [
        `  <wpt lat="${point.lat.toFixed(6)}" lon="${point.lng.toFixed(6)}">`,
      ];
      if (point.name) {
        lines.push(`    <name>${escapeXml(point.name)}</name>`);
      }
      if (point.note) {
        lines.push(`    <desc>${escapeXml(point.note)}</desc>`);
      }
      lines.push("  </wpt>");
      return lines.join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="bikecommunity" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${safeName}</name>
    ${safeDescription ? `<desc>${safeDescription}</desc>` : ""}
  </metadata>
  <trk>
    <name>${safeName}</name>
    <trkseg>
${trackXml}
    </trkseg>
  </trk>
${waypointXml}
</gpx>
`;
}

export function pathToGpxPoints(
  path: [number, number][]
): GpxPoint[] {
  return path.map(([lng, lat]) => ({ lat, lng }));
}

export function waypointsToGpxPoints(waypoints: RouteWaypoint[]): GpxPoint[] {
  return waypoints.map((waypoint) => ({
    lat: waypoint.lat,
    lng: waypoint.lng,
    name: waypoint.name,
    note: waypoint.note,
  }));
}

export function sanitizeGpxFilename(name: string): string {
  return name
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}
