"use client";

import type { ReactNode } from "react";
import { NaverMapsProvider } from "@/components/map/NaverMapsProvider";
import { USE_NAVER_MAP } from "@/lib/map-config";

export default function MapLayoutProvider({ children }: { children: ReactNode }) {
  if (USE_NAVER_MAP) {
    return <NaverMapsProvider>{children}</NaverMapsProvider>;
  }

  return children;
}
