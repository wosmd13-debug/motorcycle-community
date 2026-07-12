import MapLayoutProvider from "@/components/map/MapLayoutProvider";

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <MapLayoutProvider>{children}</MapLayoutProvider>;
}
