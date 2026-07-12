"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

type PortalModalProps = {
  onClose: () => void;
  children: ReactNode;
  overlayClassName?: string;
  closeOnBackdrop?: boolean;
  labelledBy?: string;
};

export default function PortalModal({
  onClose,
  children,
  overlayClassName = "",
  closeOnBackdrop = true,
  labelledBy,
}: PortalModalProps) {
  useBodyScrollLock(true);
  const backdropPointerDownRef = useRef(false);
  const openedAtRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    openedAtRef.current = Date.now();
    backdropPointerDownRef.current = false;
  }, []);

  const handleBackdropPointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    backdropPointerDownRef.current = event.target === event.currentTarget;
  };

  const handleBackdropPointerUp = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!closeOnBackdrop) return;
    if (Date.now() - openedAtRef.current < 400) return;
    if (!backdropPointerDownRef.current) return;
    if (event.target !== event.currentTarget) return;
    onClose();
    backdropPointerDownRef.current = false;
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`portal-modal-overlay ${overlayClassName}`.trim()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onPointerDown={closeOnBackdrop ? handleBackdropPointerDown : undefined}
      onPointerUp={closeOnBackdrop ? handleBackdropPointerUp : undefined}
    >
      <div className="w-full" onPointerDown={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}
