import Link from "next/link";
import { notFound } from "next/navigation";
import BoardDetailView from "@/components/board/BoardDetailView";
import { getBoardPost } from "@/lib/board-store";

export const dynamic = "force-dynamic";

type BoardDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BoardDetailPage({ params }: BoardDetailPageProps) {
  const { id } = await params;
  const post = await getBoardPost(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="portal-page">
      <div className="portal-container space-y-3 sm:space-y-4">
        <Link
          href="/board"
          className="inline-flex items-center gap-1 text-sm font-semibold text-signature-dark transition hover:text-signature-darker"
        >
          ← 게시판 목록
        </Link>

        <BoardDetailView initialPost={post} />
      </div>
    </div>
  );
}
