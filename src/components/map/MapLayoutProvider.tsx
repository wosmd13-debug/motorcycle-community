"use client";

import type { ReactNode } from "react";
import { NaverMapsProvider } from "@/components/map/NaverMapsProvider";

export default function MapLayoutProvider({ children }: { children: ReactNode }) {
  return <NaverMapsProvider>{children}</NaverMapsProvider>;
}
