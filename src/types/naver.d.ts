declare global {
  namespace naver {
    namespace maps {
      class LatLng {
        constructor(lat: number, lng: number);
        lat(): number;
        lng(): number;
      }

      class LatLngBounds {
        constructor(sw?: LatLng, ne?: LatLng);
        extend(latlng: LatLng): LatLngBounds;
      }

      class Size {
        constructor(width: number, height: number);
      }

      class Point {
        constructor(x: number, y: number);
      }

      interface MapOptions {
        center: LatLng;
        zoom: number;
        zoomControl?: boolean;
        zoomControlOptions?: { position: number };
      }

      interface FitBoundsMargin {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
      }

      class Map {
        constructor(element: HTMLElement | string, options: MapOptions);
        panTo(latlng: LatLng): void;
        setZoom(zoom: number): void;
        fitBounds(bounds: LatLngBounds, margin?: FitBoundsMargin): void;
      }

      interface MarkerIcon {
        content?: string;
        size?: Size;
        anchor?: Point;
      }

      interface MarkerOptions {
        map?: Map | null;
        position: LatLng;
        title?: string;
        icon?: MarkerIcon;
      }

      class Marker {
        constructor(options: MarkerOptions);
        setMap(map: Map | null): void;
        setPosition(position: LatLng): void;
        getPosition(): LatLng;
      }

      interface PolylineOptions {
        map?: Map | null;
        path: LatLng[];
        strokeColor?: string;
        strokeWeight?: number;
        strokeOpacity?: number;
        strokeLineCap?: string;
        strokeLineJoin?: string;
      }

      class Polyline {
        constructor(options: PolylineOptions);
        setMap(map: Map | null): void;
        setPath(path: LatLng[]): void;
      }

      class InfoWindow {
        constructor(options: InfoWindowOptions);
        open(map: Map, marker: Marker): void;
        close(): void;
        setContent(content: string | HTMLElement): void;
      }

      interface InfoWindowOptions {
        content?: string | HTMLElement;
        borderWidth?: number;
        backgroundColor?: string;
        anchorSize?: Size;
        anchorSkew?: boolean;
        pixelOffset?: Point;
      }

      namespace Event {
        function addListener(
          target: Marker | Map,
          type: string,
          listener: () => void
        ): void;
        function trigger(target: Map, type: string): void;
      }

      const Position: {
        TOP_RIGHT: number;
      };
    }
  }

  interface Window {
    naver: typeof naver;
    navermap_authFailure?: () => void;
  }
}

export {};
