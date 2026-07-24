import type { Metadata } from "next";
import { siteLegalInfo } from "@/lib/site-legal";

/** 공개 브랜드명 (검색·OG). UI 헤더의 anra와 병행. */
export const SITE_NAME = "Byanra";
export const SITE_NAME_SHORT = "anra";
export const SITE_TAGLINE = "바이크 커뮤니티";

export const DEFAULT_DESCRIPTION =
  "바이크·오토바이 라이더 커뮤니티 Byanra. 자유게시판, 라이딩 모집, 바리 코스, 주유소·지도, 갤러리, 중고거래까지 한곳에서.";

export const DEFAULT_KEYWORDS = [
  "바이크 커뮤니티",
  "오토바이 커뮤니티",
  "라이딩 모임",
  "바이크 게시판",
  "오토바이 동호회",
  "라이딩 코스",
  "바리 코스",
  "바이크 카페",
  "오토바이 중고거래",
  "주유소 지도",
  "Byanra",
  "anra",
] as const;

export function getSiteUrl(): string {
  return siteLegalInfo.siteUrl.replace(/\/$/, "") || "https://byanra.com";
}

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return `${base}/`;
  return path.startsWith("http")
    ? path
    : `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export type PageSeoInput = {
  title: string;
  description?: string;
  path: string;
  keywords?: string[];
  image?: string | null;
  type?: "website" | "article";
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  keywords,
  image,
  type = "website",
  noIndex = false,
}: PageSeoInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image
    ? image.startsWith("http")
      ? image
      : absoluteUrl(image)
    : absoluteUrl("/opengraph-image");

  const fullTitle =
    title === SITE_NAME || title.includes(SITE_NAME)
      ? title
      : undefined;

  return {
    title: fullTitle ?? title,
    description,
    keywords: keywords ? [...DEFAULT_KEYWORDS, ...keywords] : [...DEFAULT_KEYWORDS],
    alternates: {
      canonical: url,
    },
    openGraph: {
      type,
      locale: "ko_KR",
      url,
      siteName: SITE_NAME,
      title: fullTitle ?? `${title} | ${SITE_NAME}`,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} ${SITE_TAGLINE}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle ?? `${title} | ${SITE_NAME}`,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export function truncateText(text: string, max = 155): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trim()}…`;
}

export type BreadcrumbItem = {
  name: string;
  href?: string;
};

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  const base = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.href
        ? { item: absoluteUrl(item.href) }
        : index === 0
          ? { item: `${base}/` }
          : {}),
    })),
  };
}

export function organizationJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: [SITE_NAME_SHORT, "바이크커뮤니티"],
    url,
    logo: absoluteUrl("/opengraph-image"),
    email: siteLegalInfo.contactEmail,
    description: DEFAULT_DESCRIPTION,
    sameAs: [],
  };
}

export function websiteJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: SITE_NAME_SHORT,
    url,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "ko-KR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function articleJsonLd(options: {
  title: string;
  description: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  image?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: options.title,
    description: options.description,
    mainEntityOfPage: absoluteUrl(options.path),
    url: absoluteUrl(options.path),
    datePublished: options.datePublished,
    dateModified: options.dateModified ?? options.datePublished,
    author: {
      "@type": "Person",
      name: options.authorName ?? SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/opengraph-image"),
      },
    },
    image: options.image
      ? options.image.startsWith("http")
        ? options.image
        : absoluteUrl(options.image)
      : absoluteUrl("/opengraph-image"),
    inLanguage: "ko-KR",
  };
}
