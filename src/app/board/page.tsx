import BoardExplorer from "@/components/board/BoardExplorer";
import { boardCategories } from "@/lib/board";
import { readBoardPosts } from "@/lib/board-store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

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

  const initialPosts = await readBoardPosts();

  return (
    <div className="portal-page">
      <div className="portal-container">
        <BoardExplorer
          initialPosts={initialPosts}
          initialQuery={q ?? ""}
          initialCategory={resolveBoardCategory(category)}
        />
      </div>
    </div>
  );
}
