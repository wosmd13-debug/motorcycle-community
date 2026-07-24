import Image from "next/image";
import Link from "next/link";
import { pickTodaysBike } from "@/lib/home-action";
import { readGalleryPosts } from "@/lib/gallery-store";

export default async function HomeTodaysBike() {
  const posts = await readGalleryPosts();
  const bike = pickTodaysBike(posts);

  if (!bike) {
    return (
      <section
        id="todays-bike"
        className="portal-panel home-reveal overflow-hidden"
      >
        <div className="portal-panel-head">
          <div className="flex items-center gap-2">
            <h2 className="portal-panel-title">오늘의 바이크</h2>
            <span className="portal-badge">PICK</span>
          </div>
          <Link href="/gallery" className="portal-panel-more">
            갤러리
          </Link>
        </div>
        <div className="home-empty-state">
          <p className="home-empty-state-title">등록된 바이크 사진이 아직 없어요</p>
          <p className="home-empty-state-copy">
            내 바이크 사진을 올리면 여기에 소개될 수 있어요.
          </p>
          <Link href="/gallery" className="home-hero-cta home-hero-cta-primary">
            사진 올리기
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      id="todays-bike"
      className="portal-panel home-reveal overflow-hidden"
    >
      <div className="portal-panel-head">
        <div className="flex items-center gap-2">
          <h2 className="portal-panel-title">오늘의 바이크</h2>
          <span className="portal-badge">PICK</span>
        </div>
        <Link href="/gallery" className="portal-panel-more">
          갤러리
        </Link>
      </div>

      <div className="home-todays-bike">
        <div className="home-todays-bike-media">
          <Image
            src={bike.imageUrl}
            alt={bike.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 480px"
            priority={false}
          />
        </div>
        <div className="home-todays-bike-copy">
          <p className="home-todays-bike-label">Today&apos;s Bike</p>
          <h3 className="home-todays-bike-title">{bike.title}</h3>
          <p className="home-todays-bike-blurb">{bike.blurb}</p>
          <p className="home-todays-bike-author">{bike.author}</p>
          <Link
            href={bike.href}
            className="home-action-btn home-action-btn-primary home-todays-bike-cta"
          >
            후기 보러가기
          </Link>
        </div>
      </div>
    </section>
  );
}
