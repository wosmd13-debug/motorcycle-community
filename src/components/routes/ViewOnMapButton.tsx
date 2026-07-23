"use client";

import type { PointerEvent, ReactNode } from "react";
import { useRoutesExplorer } from "@/components/routes/RoutesExplorerContext";
import { buildMapHref, buildMemberMapHref } from "@/lib/route-links";
import { beginRoutesScrollPin } from "@/lib/routes-page-scroll";

type ViewOnMapButtonProps = {
  routeId: string | number;
  className?: string;
  children?: ReactNode;
  memberRoute?: boolean;
};

export default function ViewOnMapButton({
  routeId,
  className,
  children = "지도에서 보기",
  memberRoute = false,
}: ViewOnMapButtonProps) {
  const explorer = useRoutesExplorer();
  const href = memberRoute
    ? buildMemberMapHref(String(routeId))
    : buildMapHref({ routeId: Number(routeId) });

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    beginRoutesScrollPin();
  };

  const handleClick = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    explorer?.viewOnMap(String(routeId));
  };

  if (explorer) {
    return (
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        className={className}
      >
        {children}
      </button>
    );
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
