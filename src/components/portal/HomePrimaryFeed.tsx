import HomePostFeed from "@/components/portal/HomePostFeed";
import HomeTodayHot from "@/components/portal/HomeTodayHot";
import { buildLatestBoardFeedItems } from "@/lib/home-feed";
import { buildTodayHotCards } from "@/lib/home-hot";
import { readBoardPosts } from "@/lib/board-store";

/** Sprint 1: shared board read for Hot + Latest (Hot ids excluded from Latest). */
export default async function HomePrimaryFeed() {
  const boardPosts = await readBoardPosts();
  const hotPosts = buildTodayHotCards(boardPosts, 6);
  const latestPosts = buildLatestBoardFeedItems({
    boardPosts,
    excludeIds: hotPosts.map((post) => post.id),
    limit: 10,
  });

  return (
    <>
      <HomeTodayHot posts={hotPosts} />
      <HomePostFeed posts={latestPosts} />
    </>
  );
}
