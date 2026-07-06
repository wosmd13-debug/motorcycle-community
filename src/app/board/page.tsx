import PageHeader from "@/components/PageHeader";
import BoardExplorer from "@/components/board/BoardExplorer";

export default function BoardPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        emoji="💬"
        title="게시판"
        description="카테고리별로 글을 구분해 올릴 수 있어요. 자유·코스·정비·장비·모임 중 어디에 쓸지 헷갈리면 아래 안내를 확인하세요."
      />

      <BoardExplorer />
    </div>
  );
}
