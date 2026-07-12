import Link from "next/link";
import type { SearchResults as SearchResultsData } from "@/lib/search";

type SearchResultsProps = {
  results: SearchResultsData;
};

export default function SearchResults({ results }: SearchResultsProps) {
  if (!results.query) {
    return (
      <div className="portal-panel px-6 py-12 text-center">
        <p className="text-sm text-stone-500">
          검색어를 입력하면 자유게시판, 자유홍보, 갤러리, 영상, 카페, 바리 코스를
          한 번에 찾을 수 있습니다.
        </p>
      </div>
    );
  }

  if (results.totalCount === 0) {
    return (
      <div className="portal-panel px-6 py-12 text-center">
        <p className="text-lg font-bold text-stone-800">
          &quot;{results.query}&quot; 검색 결과가 없습니다.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          다른 키워드로 다시 검색해 보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-500">
        <strong className="text-signature-dark">{results.query}</strong> 검색
        결과 총 <strong>{results.totalCount}</strong>건
      </p>

      {results.groups.map((group) => (
        <section key={group.source} className="portal-panel overflow-hidden">
          <div className="portal-panel-head">
            <h2 className="portal-panel-title">{group.label}</h2>
            {group.total > group.items.length && (
              <Link href={group.moreHref} className="portal-panel-more">
                {group.total}건 더보기
              </Link>
            )}
          </div>

          <ul className="divide-y divide-signature/10">
            {group.items.map((item) => (
              <li key={`${item.source}-${item.id}`}>
                <Link
                  href={item.href}
                  className="block px-4 py-4 transition hover:bg-signature-light/40 sm:px-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="portal-badge">{item.sourceLabel}</span>
                    {item.date && (
                      <span className="text-xs text-stone-400">{item.date}</span>
                    )}
                  </div>
                  <h3 className="mt-2 text-base font-bold text-stone-800">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-signature-dark">
                    {item.subtitle}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {item.excerpt}
                  </p>
                  {item.meta && (
                    <p className="mt-2 text-xs text-stone-400">{item.meta}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
