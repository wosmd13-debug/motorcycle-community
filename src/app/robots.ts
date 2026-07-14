import type { MetadataRoute } from "next";
import { siteLegalInfo } from "@/lib/site-legal";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = siteLegalInfo.siteUrl.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/login", "/register", "/profile"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
