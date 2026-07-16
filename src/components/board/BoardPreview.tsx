import Link from "next/link";
import { BoardCategoryBadge } from "@/components/board/BoardCategoryGuide";
import AuthorWithGrade from "@/components/ranking/AuthorWithGrade";
import { filterBoardPosts } from "@/lib/board";
import { readBoardPosts } from "@/lib/board-store";
import {
  collectAuthorGradeSources,
  collectNicknamesNeedingGradeLookup,
} from "@/lib/member-grade-display";
import { getGradesByNicknames } from "@/lib/ranking-server";

export default async function BoardPreview() {
  const posts = filterBoardPosts({
    posts: await readBoardPosts(),
    sort: "popular",
  }).slice(0, 3);

  const gradeSources = collectAuthorGradeSources(posts);
  const gradesByNickname = await getGradesByNicknames(
    collectNicknamesNeedingGradeLookup(gradeSources)
  );

  return (
    <div className="rounded-3xl border border-signature/20 bg-white p-6 shadow-sm lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">인기 게시글</h2>
        <Link href="/board" className="text-sm font-semibold text-signature-dark">
          더보기
        </Link>
      </div>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <p className="text-sm text-slate-500">아직 게시글이 없습니다.</p>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`/board/${post.id}`}
              className="block rounded-2xl bg-signature-light/70 px-4 py-3 transition hover:bg-signature-light"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-signature-dark">
                <BoardCategoryBadge category={post.category} />
                <AuthorWithGrade
                  author={post.author}
                  authorGradeId={post.authorGradeId}
                  gradesByNickname={gradesByNickname}
                  nicknameClassName="text-signature-dark"
                  className="inline-flex items-center gap-1"
                />
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">
                  좋아요 {post.likes} · 조회 {post.views}
                </span>
              </div>
              <p className="board-post-title board-post-title-clamp mt-2 font-medium text-slate-800">{post.title}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
