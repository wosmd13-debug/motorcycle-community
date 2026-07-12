"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { resetBodyScrollLock } from "@/lib/body-scroll-lock";

export default function NavigationScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    resetBodyScrollLock();
  }, [pathname]);

  return null;
}
