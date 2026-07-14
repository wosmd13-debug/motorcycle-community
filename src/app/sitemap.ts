import type { MetadataRoute } from "next";
import { siteLegalInfo } from "@/lib/site-legal";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = siteLegalInfo.siteUrl.replace(/\/$/, "");
  const now = new Date();

  const paths = [
    "",
    "/board",
    "/gallery",
    "/videos",
    "/promo",
    "/marketplace",
    "/cafes",
    "/routes",
    "/map",
    "/weather",
    "/meetups",
    "/services",
    "/ranking",
    "/missions",
    "/shop",
    "/legal",
    "/legal/terms",
    "/legal/privacy",
    "/legal/community",
    "/legal/youth",
  ];

  return paths.map((path) => ({
    url: `${siteUrl}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : path.startsWith("/legal") ? 0.3 : 0.7,
  }));
}
