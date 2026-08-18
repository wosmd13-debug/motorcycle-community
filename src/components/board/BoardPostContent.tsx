"use client";

import { Fragment, useMemo } from "react";

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

export default function BoardPostContent({ content }: { content: string }) {
  const nodes = useMemo(() => {
    const parts: Array<string | { href: string; label: string }> = [];
    let lastIndex = 0;

    for (const match of content.matchAll(URL_PATTERN)) {
      const start = match.index ?? 0;
      const raw = match[0];

      if (start > lastIndex) {
        parts.push(content.slice(lastIndex, start));
      }

      const link = toSafeLink(raw);
      parts.push(link ?? raw);
      lastIndex = start + raw.length;
    }

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts;
  }, [content]);

  return (
    <p className="whitespace-pre-wrap text-sm leading-7 text-stone-700">
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
    </p>
  );
}
