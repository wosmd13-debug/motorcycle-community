import type { MetadataRoute } from "next";
import { readBoardPosts } from "@/lib/board-store";
import { readGalleryPosts } from "@/lib/gallery-store";
import { readMarketplaceItems } from "@/lib/marketplace-store";
import { readMeetups } from "@/lib/meetup-store";
import { readPromoPosts } from "@/lib/promo-store";
import { readRiderCafes } from "@/lib/rider-cafe-store";
import { getSiteUrl } from "@/lib/seo";
import { readVideos } from "@/lib/video-store";

const MAX_DYNAMIC = 200;

function entry(
  path: string,
  options: {
    lastModified?: Date | string;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: number;
  } = {}
): MetadataRoute.Sitemap[number] {
  const siteUrl = getSiteUrl();
  return {
    url: `${siteUrl}${path === "/" ? "/" : path}`,
    lastModified: options.lastModified
      ? new Date(options.lastModified)
      : new Date(),
    changeFrequency: options.changeFrequency ?? "weekly",
    priority: options.priority ?? 0.7,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPaths: MetadataRoute.Sitemap = [
    entry("/", { changeFrequency: "daily", priority: 1, lastModified: now }),
    entry("/board", { changeFrequency: "daily", priority: 0.9 }),
    entry("/gallery", { changeFrequency: "daily", priority: 0.8 }),
    entry("/videos", { changeFrequency: "weekly", priority: 0.7 }),
    entry("/promo", { changeFrequency: "weekly", priority: 0.6 }),
    entry("/marketplace", { changeFrequency: "daily", priority: 0.8 }),
    entry("/cafes", { changeFrequency: "weekly", priority: 0.7 }),
    entry("/routes", { changeFrequency: "weekly", priority: 0.8 }),
    entry("/map", { changeFrequency: "monthly", priority: 0.7 }),
    entry("/weather", { changeFrequency: "hourly", priority: 0.6 }),
    entry("/meetups", { changeFrequency: "daily", priority: 0.8 }),
    entry("/services", { changeFrequency: "weekly", priority: 0.8 }),
    entry("/ranking", { changeFrequency: "weekly", priority: 0.5 }),
    entry("/missions", { changeFrequency: "weekly", priority: 0.5 }),
    entry("/shop", { changeFrequency: "weekly", priority: 0.4 }),
    entry("/partners", { changeFrequency: "monthly", priority: 0.4 }),
    entry("/search", { changeFrequency: "weekly", priority: 0.5 }),
    entry("/feedback", { changeFrequency: "monthly", priority: 0.3 }),
    entry("/legal", { changeFrequency: "yearly", priority: 0.3 }),
    entry("/legal/terms", { changeFrequency: "yearly", priority: 0.3 }),
    entry("/legal/privacy", { changeFrequency: "yearly", priority: 0.3 }),
    entry("/legal/community", { changeFrequency: "yearly", priority: 0.3 }),
    entry("/legal/youth", { changeFrequency: "yearly", priority: 0.3 }),
  ];

  try {
    const [boards, galleries, videos, markets, cafes, meetups, promos] =
      await Promise.all([
        readBoardPosts(),
        readGalleryPosts(),
        readVideos(),
        readMarketplaceItems(),
        readRiderCafes(),
        readMeetups(),
        readPromoPosts(),
      ]);

    const dynamicEntries: MetadataRoute.Sitemap = [
      ...boards
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, MAX_DYNAMIC)
        .map((post) =>
          entry(`/board/${post.id}`, {
            lastModified: post.createdAt,
            changeFrequency: "weekly",
            priority: 0.6,
          })
        ),
      ...galleries
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, MAX_DYNAMIC)
        .map((post) =>
          entry(`/gallery/${post.id}`, {
            lastModified: post.createdAt,
            changeFrequency: "weekly",
            priority: 0.55,
          })
        ),
      ...videos
        .slice(0, MAX_DYNAMIC)
        .map((video) =>
          entry(`/videos/${video.id}`, {
            lastModified: video.createdAt,
            changeFrequency: "monthly",
            priority: 0.5,
          })
        ),
      ...markets
        .slice(0, MAX_DYNAMIC)
        .map((item) =>
          entry(`/marketplace/${item.id}`, {
            lastModified: item.createdAt,
            changeFrequency: "weekly",
            priority: 0.55,
          })
        ),
      ...cafes
        .slice(0, MAX_DYNAMIC)
        .map((cafe) =>
          entry(`/cafes/${cafe.id}`, {
            lastModified: cafe.createdAt,
            changeFrequency: "monthly",
            priority: 0.5,
          })
        ),
      ...meetups
        .slice(0, MAX_DYNAMIC)
        .map((meetup) =>
          entry(`/meetups/${meetup.id}`, {
            lastModified: meetup.createdAt,
            changeFrequency: "weekly",
            priority: 0.55,
          })
        ),
      ...promos
        .slice(0, MAX_DYNAMIC)
        .map((promo) =>
          entry(`/promo/${promo.id}`, {
            lastModified: promo.createdAt,
            changeFrequency: "weekly",
            priority: 0.45,
          })
        ),
    ];

    return [...staticPaths, ...dynamicEntries];
  } catch {
    return staticPaths;
  }
}
