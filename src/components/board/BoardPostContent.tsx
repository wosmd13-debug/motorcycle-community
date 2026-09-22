"use client";

import { Fragment, useMemo } from "react";
import { parseBoardContent } from "@/lib/board-content";

const URL_PATTERN = /(?:https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;
const TRAILING_PUNCT = /[.,;:!?)}\]'"]+$/;

function toSafeLink(raw: string): { href: string; label: string } | null {
  const trimmed = raw.replace(TRAILING_PUNCT, "");
  const trailing = raw.slice(trimmed.length);
  const href = trimmed.startsWith("www.") ? `https://${trimmed}` : trimmed;

  try {
    const parsed = new URL(href);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
  } catch {
    return null;
  }

  return { href, label: trimmed + trailing };
}

function LinkifiedText({ value }: { value: string }) {
  const nodes = useMemo(() => {
    const parts: Array<string | { href: string; label: string }> = [];
    let lastIndex = 0;

    for (const match of value.matchAll(URL_PATTERN)) {
      const start = match.index ?? 0;
      const raw = match[0];

      if (start > lastIndex) {
        parts.push(value.slice(lastIndex, start));
      }

      const link = toSafeLink(raw);
      parts.push(link ?? raw);
      lastIndex = start + raw.length;
    }

    if (lastIndex < value.length) {
      parts.push(value.slice(lastIndex));
    }

    return parts;
  }, [value]);

  return (
    <>
      {nodes.map((part, index) => {
        if (typeof part === "string") {
          return <Fragment key={`text-${index}`}>{part}</Fragment>;
        }

        return (
          <a
            key={`link-${index}-${part.href}`}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-medium text-signature-dark underline underline-offset-2 hover:text-signature"
          >
            {part.label}
          </a>
        );
      })}
    </>
  );
}

export default function BoardPostContent({
  content,
  imageUrls = [],
}: {
  content: string;
  imageUrls?: string[];
}) {
  const segments = useMemo(
    () => parseBoardContent(content, imageUrls),
    [content, imageUrls]
  );

  return (
    <div className="space-y-3 text-sm leading-7 text-stone-700">
      {segments.map((segment, index) => {
        if (segment.type === "image") {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`img-${index}-${segment.url}`}
              src={segment.url}
              alt=""
              className="w-full rounded-2xl object-cover ring-1 ring-signature/10"
            />
          );
        }

        if (!segment.value) return null;

        return (
          <p key={`text-${index}`} className="whitespace-pre-wrap">
            <LinkifiedText value={segment.value} />
          </p>
        );
      })}
    </div>
  );
}
