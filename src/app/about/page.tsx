import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";
import { siteLegalInfo } from "@/lib/site-legal";

const ABOUT_DESCRIPTION =
  "Byanra는 대한민국 라이더들을 위한 바이크 커뮤니티입니다.";

export const metadata: Metadata = buildPageMetadata({
  title: "Byanra 소개",
  description: ABOUT_DESCRIPTION,
  path: "/about",
});

const services = [
  "자유게시판",
  "라이딩 모집",
  "바이크 갤러리",
  "추천 코스",
  "바이크 정보",
  "중고거래",
  "바이크 카페",
] as const;

const principles = [
  { title: "안전한 커뮤니티", symbol: "✔" },
  { title: "존중하는 문화", symbol: "✔" },
  { title: "정확한 정보 공유", symbol: "✔" },
  { title: "지속적인 서비스 개선", symbol: "✔" },
] as const;

const goals = [
  "더 많은 라이더 연결",
  "전국 라이딩 코스 확대",
  "바이크 문화 활성화",
  "최고의 바이크 커뮤니티 구축",
] as const;

export default function AboutPage() {
  return (
    <div className="portal-page py-4">
      <div className="portal-container mx-auto max-w-3xl space-y-8">
        <section className="portal-panel overflow-hidden p-6 sm:p-8">
          <p className="text-xs font-bold tracking-wide text-signature-dark">
            Byanra 소개
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-stone-800 sm:text-3xl">
            라이더를 위한 커뮤니티, Byanra
          </h1>
          <p className="mt-4 text-sm leading-7 text-stone-600 sm:text-base">
            Byanra는 바이크를 사랑하는 사람들이
            <br />
            정보를 공유하고,
            <br />
            라이딩을 함께하며,
            <br />
            안전한 바이크 문화를 만들어가기 위한 커뮤니티입니다.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-stone-800">Byanra가 하는 일</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {services.map((item) => (
              <li key={item} className="portal-panel px-4 py-3 text-sm font-medium text-stone-700">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="portal-panel p-6 sm:p-8">
          <h2 className="text-xl font-bold text-stone-800">왜 만들었나요?</h2>
          <p className="mt-4 text-sm leading-7 text-stone-600 sm:text-base">
            국내 라이더들이 하나의 공간에서
            <br />
            정보를 공유하고
            <br />
            라이딩을 계획하며
            <br />
            좋은 문화를 만들어 갈 수 있도록
            <br />
            Byanra를 만들었습니다.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-stone-800">운영 원칙</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {principles.map((item) => (
              <div key={item.title} className="portal-panel p-5">
                <p className="text-sm font-bold text-signature-dark">
                  <span aria-hidden>{item.symbol} </span>
                  {item.title}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-stone-800">앞으로의 목표</h2>
          <ul className="portal-panel divide-y divide-signature/10">
            {goals.map((item) => (
              <li key={item} className="px-5 py-3 text-sm text-stone-700">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="portal-panel p-6 sm:p-8">
          <h2 className="text-xl font-bold text-stone-800">문의</h2>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            문의는{" "}
            <Link href="/feedback" className="font-semibold text-signature-dark hover:underline">
              Feedback 페이지
            </Link>
            또는{" "}
            <a
              href={`mailto:${siteLegalInfo.contactEmail}`}
              className="font-semibold text-signature-dark hover:underline"
            >
              {siteLegalInfo.contactEmail}
            </a>
            을 이용해 주세요.
          </p>
        </section>
      </div>
    </div>
  );
}
