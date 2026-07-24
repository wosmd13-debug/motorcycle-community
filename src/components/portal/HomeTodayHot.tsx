import HomeTodayHotClient from "@/components/portal/HomeTodayHotClient";
import type { HomeHotCard } from "@/lib/home-hot";

type HomeTodayHotProps = {
  posts: HomeHotCard[];
};

export default function HomeTodayHot({ posts }: HomeTodayHotProps) {
  return <HomeTodayHotClient posts={posts} />;
}
