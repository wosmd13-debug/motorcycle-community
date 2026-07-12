import { deleteBoardPost } from "@/lib/board-store";
import { deleteGalleryPost } from "@/lib/gallery-store";
import { deleteMarketplaceItem } from "@/lib/marketplace-store";
import { deletePromoPost } from "@/lib/promo-store";
import type { ReportTargetType } from "@/lib/reports";
import { deleteVideo } from "@/lib/video-store";

export async function deleteContentByTarget(
  targetType: ReportTargetType,
  targetId: string
): Promise<boolean> {
  switch (targetType) {
    case "board":
      return deleteBoardPost(targetId);
    case "gallery":
      return deleteGalleryPost(targetId);
    case "video":
      return deleteVideo(targetId);
    case "promo":
      return deletePromoPost(targetId);
    case "marketplace":
      return deleteMarketplaceItem(targetId);
    default:
      return false;
  }
}

export async function getContentTitle(
  targetType: ReportTargetType,
  targetId: string
): Promise<string | null> {
  switch (targetType) {
    case "board": {
      const { getBoardPost } = await import("@/lib/board-store");
      const post = await getBoardPost(targetId);
      return post?.title ?? null;
    }
    case "gallery": {
      const { getGalleryPost } = await import("@/lib/gallery-store");
      const post = await getGalleryPost(targetId);
      return post?.title ?? null;
    }
    case "video": {
      const { getVideo } = await import("@/lib/video-store");
      const video = await getVideo(targetId);
      return video?.title ?? null;
    }
    case "promo": {
      const { getPromoPost } = await import("@/lib/promo-store");
      const post = await getPromoPost(targetId);
      return post?.title ?? null;
    }
    case "marketplace": {
      const { getMarketplaceItem } = await import("@/lib/marketplace-store");
      const item = await getMarketplaceItem(targetId);
      return item?.title ?? null;
    }
    default:
      return null;
  }
}
