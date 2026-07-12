import MapLayoutProvider from "@/components/map/MapLayoutProvider";

export default function RoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MapLayoutProvider>{children}</MapLayoutProvider>;
}
