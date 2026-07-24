import type { Metadata } from "next";
import BoardExplorer from "@/components/board/BoardExplorer";
import PageHeader from "@/components/PageHeader";
import SiteBreadcrumbs from "@/components/seo/SiteBreadcrumbs";
import { boardCategories } from "@/lib/board";
import { readBoardPosts } from "@/lib/board-store";
import { toPublicEngagementList } from "@/lib/engagement";
import { buildPageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "바이크 자유게시판",
  description:
    "오토바이·바이크 라이더 자유게시판. 코스 추천, 정비 질문, 장비 후기, 라이딩 모임을 Byanra에서 나누세요.",
  path: "/board",
  keywords: ["바이크 게시판", "오토바이 게시판", "라이딩 후기", "정비 질문"],
});

type BoardPageProps = {
  searchParams: Promise<{ q?: string; id?: string; category?: string }>;
};

function resolveBoardCategory(
  value?: string
): (typeof boardCategories)[number] {
  if (!value) return "전체";
  return boardCategories.includes(value as (typeof boardCategories)[number])
    ? (value as (typeof boardCategories)[number])
    : "전체";
}

export default async function BoardPage({ searchParams }: BoardPageProps) {
  const { q, id, category } = await searchParams;

  if (id) {
    redirect(`/board/${id}`);
  }

  const initialPosts = toPublicEngagementList(await readBoardPosts());

  return (
    <div className="portal-page">
      <div className="portal-container space-y-3 sm:space-y-4">
        <SiteBreadcrumbs
          items={[
            { name: "홈", href: "/" },
            { name: "자유게시판" },
          ]}
        />
        <PageHeader
          title="바이크 자유게시판"
          description="코스·정비·장비·모임까지, 라이더들의 이야기를 자유롭게 나눠보세요."
        />
        <BoardExplorer
          initialPosts={initialPosts}
          initialQuery={q ?? ""}
          initialCategory={resolveBoardCategory(category)}
        />
      </div>
    </div>
  );
}
