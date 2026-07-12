import Image from "next/image";
import Link from "next/link";
import {
  filterVideos,
  getYouTubeThumbnailUrl,
} from "@/lib/videos";
import { readVideos } from "@/lib/video-store";

export default async function HomeVideosFeatured() {
  const videos = filterVideos({
    videos: await readVideos(),
    sort: "popular",
  }).slice(0, 4);

  if (videos.length === 0) {
    return null;
  }

  return (
    <section className="portal-panel overflow-hidden">
      <div className="portal-panel-head">
        <div className="flex items-center gap-2">
          <h2 className="portal-panel-title">추천 영상</h2>
          <span className="portal-badge">YT</span>
        </div>
        <Link href="/videos" className="portal-panel-more">
          더보기
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-1 bg-signature-muted p-1 sm:grid-cols-4">
        {videos.map((video, index) => (
          <Link
            key={video.id}
            href={`/videos/${video.id}`}
            className="group relative aspect-video overflow-hidden bg-stone-900 ring-1 ring-signature/20 transition hover:ring-signature"
          >
            <Image
              src={getYouTubeThumbnailUrl(video.youtubeVideoId)}
              alt={video.title}
              fill
              className="object-cover opacity-90 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
            <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center bg-signature text-[10px] font-bold text-white shadow">
              {index + 1}
            </span>
            <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center bg-black/60 text-[9px] font-bold text-white">
              ▶
            </span>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2.5 pt-6">
              <p className="line-clamp-2 text-[11px] font-medium leading-4 text-white">
                {video.title}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-white/70">
                {video.channelName}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
