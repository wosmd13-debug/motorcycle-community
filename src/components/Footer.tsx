import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-orange-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-center text-sm text-slate-500 sm:px-6">
        <p className="font-semibold text-slate-700">🏍️ 라이더모임</p>
        <p>오토바이를 사랑하는 라이더들을 위한 밝고 따뜻한 커뮤니티</p>
        <p>
          <Link href="/cafes" className="font-semibold text-orange-500 hover:underline">
            라이더 카페 등록
          </Link>
          {" · "}
          <Link href="/partners" className="font-semibold text-orange-500 hover:underline">
            제휴·홍보 (사장님 입점)
          </Link>
        </p>
        <p>© 2026 Rider Meetup. All rights reserved.</p>
      </div>
    </footer>
  );
}
