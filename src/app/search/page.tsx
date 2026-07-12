import PageHeader from "@/components/PageHeader";
import SearchForm from "@/components/search/SearchForm";
import SearchResults from "@/components/search/SearchResults";
import { getPopularSearchHints, searchSite } from "@/lib/search-server";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = await searchSite(query);
  const hints = await getPopularSearchHints();

  return (
    <div className="portal-page py-4">
      <div className="portal-container space-y-4">
        <PageHeader
          title="통합 검색"
          description="자유게시판, 자유홍보, 중고거래, 갤러리, 영상, 바이크 카페, 바리 코스를 한 번에 검색합니다."
        />

        <SearchForm initialQuery={query} />

        {!query && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-stone-500">추천</span>
            {hints.map((hint) => (
              <a
                key={hint}
                href={`/search?q=${encodeURIComponent(hint)}`}
                className="border border-signature/20 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-signature hover:bg-signature-light hover:text-signature-dark"
              >
                {hint}
              </a>
            ))}
          </div>
        )}

        <SearchResults results={results} />
      </div>
    </div>
  );
}
