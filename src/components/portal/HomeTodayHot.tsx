import HomeTodayHotClient from "@/components/portal/HomeTodayHotClient";
import { readBoardPosts } from "@/lib/board-store";
import { buildHotLists } from "@/lib/home-hot";

export default async function HomeTodayHot() {
  const posts = await readBoardPosts();
  const lists = buildHotLists(posts, 8);
  return <HomeTodayHotClient lists={lists} />;
}
