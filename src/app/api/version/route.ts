import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { checkDataStoreHealth } from "@/lib/json-store-write";

export const dynamic = "force-dynamic";

async function readGalleryMeta() {
  try {
    const raw = await readFile(path.join(process.cwd(), "data", "gallery.json"), "utf8");
    const posts = JSON.parse(raw) as { id?: string }[];
    const count = Array.isArray(posts) ? posts.length : 0;
    const isSeed = Array.isArray(posts) && posts.some((post) => post.id === "seed-1");
    return { count, isSeed };
  } catch {
    return { count: 0, isSeed: false };
  }
}

/** 배포 반영 확인용 — 모바일 브라우저에서 /api/version 접속 */
export async function GET() {
  const commit = process.env.APP_COMMIT ?? "unknown";
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const siteOk = site.startsWith("https://") && !site.includes("localhost");
  const data = await checkDataStoreHealth();
  const gallery = await readGalleryMeta();
  const ok = siteOk && data.galleryWritable && !gallery.isSeed;

  return NextResponse.json({
    commit,
    site,
    dataWritable: data.galleryWritable,
    galleryPosts: gallery.count,
    gallerySeed: gallery.isSeed,
    ok,
    hint: gallery.isSeed
      ? "gallery.json이 샘플 데이터입니다 — bash up.sh 실행 필요"
      : ok
        ? "배포 설정 정상 — 댓글 저장 가능"
        : data.galleryWritable
          ? "SITE_URL 설정을 확인한 뒤 bash up.sh 실행"
          : "gallery.json 쓰기 불가 — bash up.sh 실행 후 컨테이너 재시작",
    dataError: data.error,
  });
}
