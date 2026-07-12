"use client";

import Image from "next/image";

type PromoMediaProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
};

export default function PromoMedia({
  src,
  alt,
  className = "object-cover",
  fill = true,
  sizes = "100vw",
  priority = false,
}: PromoMediaProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
    />
  );
}
