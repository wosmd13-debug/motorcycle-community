"use client";

import { createContext, useContext, type ReactNode } from "react";

type RoutesExplorerContextValue = {
  viewOnMap: (routeId: string) => void;
};

const RoutesExplorerContext = createContext<RoutesExplorerContextValue | null>(
  null
);

export function RoutesExplorerProvider({
  children,
  viewOnMap,
}: {
  children: ReactNode;
  viewOnMap: (routeId: string) => void;
}) {
  return (
    <RoutesExplorerContext.Provider value={{ viewOnMap }}>
      {children}
    </RoutesExplorerContext.Provider>
  );
}

export function useRoutesExplorer() {
  return useContext(RoutesExplorerContext);
}
