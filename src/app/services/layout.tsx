import MapLayoutProvider from "@/components/map/MapLayoutProvider";

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MapLayoutProvider>{children}</MapLayoutProvider>;
}
