import Link from "next/link";
import { HOME_HERO } from "@/lib/home-portal";

export default function HomeHero() {
  return (
    <section className="home-hero home-reveal" aria-label="Byanra 소개">
      <div className="home-hero-glow" aria-hidden />
      <div className="home-hero-grid" aria-hidden />
      <div className="relative z-[1] flex flex-col gap-5 sm:gap-6">
        <div>
          <p className="home-hero-kicker">바이크 커뮤니티</p>
          <h1 className="home-hero-brand">{HOME_HERO.brand}</h1>
          <p className="home-hero-tagline">{HOME_HERO.tagline}</p>
          <p className="home-hero-sub">{HOME_HERO.subcopy}</p>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <a href="#today-hot" className="home-hero-cta home-hero-cta-primary">
            오늘의 인기 게시글 보기
          </a>
          <Link href="/meetups" className="home-hero-cta home-hero-cta-secondary">
            라이딩 모집 보기
          </Link>
        </div>
      </div>
    </section>
  );
}
