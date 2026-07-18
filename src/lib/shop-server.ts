import { randomUUID } from "crypto";
import { isOperatorUser } from "@/lib/admin";
import { getUserMissionClaims } from "@/lib/mission-store";
import {
  buildCosmeticLook,
  emptyInventory,
  emptyWallet,
  getShopItem,
  OPERATOR_UNLIMITED_BALANCE,
  SHOP_ITEMS,
  SHOP_SIGNUP_BONUS,
  shopKindLabel,
  type ShopCosmeticLook,
  type ShopEquipped,
  type ShopInventory,
  type ShopItemDefinition,
  type ShopWallet,
} from "@/lib/shop";
import {
  getShopInventory,
  getShopWallet,
  getUserLedger,
  readAllInventories,
  updateShopUser,
} from "@/lib/shop-store";
import { readUsers } from "@/lib/user-store";

async function isOperatorUserId(userId: string): Promise<boolean> {
  const users = await readUsers();
  const user = users.find((entry) => entry.id === userId);
  return isOperatorUser(user);
}

function withOperatorWallet(wallet: ShopWallet, unlimited: boolean): ShopWallet {
  if (!unlimited) return wallet;
  return {
    ...wallet,
    balance: OPERATOR_UNLIMITED_BALANCE,
  };
}

function addDaysIso(days: number, from = new Date()): string {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/** 미션 클레임·가입 보너스를 지갑에 동기화 */
export async function syncShopWallet(userId: string): Promise<ShopWallet> {
  const claims = await getUserMissionClaims(userId);
  const missionTotal = claims.reduce((sum, claim) => sum + claim.points, 0);

  const result = await updateShopUser(userId, ({ wallet, inventory }) => {
    let next = { ...wallet };
    let earnAmount = 0;
    const reasons: string[] = [];

    const missionDelta = Math.max(0, missionTotal - next.missionCredited);
    if (missionDelta > 0) {
      earnAmount += missionDelta;
      reasons.push("미션 보상");
      next.missionCredited = missionTotal;
    } else if (next.missionCredited !== missionTotal) {
      next.missionCredited = missionTotal;
    }

    if (!next.signupBonusClaimed) {
      earnAmount += SHOP_SIGNUP_BONUS;
      reasons.push("가입 보너스");
      next.signupBonusClaimed = true;
    }

    if (earnAmount <= 0) {
      return { wallet: next, inventory };
    }

    next = {
      ...next,
      balance: next.balance + earnAmount,
      lifetimeEarned: next.lifetimeEarned + earnAmount,
    };

    return {
      wallet: next,
      inventory,
      ledgerEntry: {
        id: randomUUID(),
        userId,
        type: "earn",
        amount: earnAmount,
        reason: reasons.join(" + "),
        createdAt: new Date().toISOString(),
      },
    };
  });

  return result.wallet;
}

export async function getShopDashboard(userId: string) {
  const syncedWallet = await syncShopWallet(userId);
  const [inventory, ledger, unlimited] = await Promise.all([
    getShopInventory(userId),
    getUserLedger(userId, 20),
    isOperatorUserId(userId),
  ]);
  const wallet = withOperatorWallet(syncedWallet, unlimited);
  const look = buildCosmeticLook(inventory);

  return {
    wallet,
    unlimited,
    inventory,
    ledger,
    look,
    catalog: SHOP_ITEMS.map((item) => ({
      ...item,
      kindLabel: shopKindLabel(item.kind),
      owned: inventory.ownedItemIds.includes(item.id),
      equipped:
        item.slot != null &&
        inventory.equipped[item.slot as keyof ShopEquipped] === item.id,
      canAfford: unlimited || wallet.balance >= item.price,
    })),
  };
}

export async function purchaseShopItem(input: {
  userId: string;
  itemId: string;
}) {
  const item = getShopItem(input.itemId);
  if (!item) {
    throw new Error("존재하지 않는 상품입니다.");
  }

  const unlimited = await isOperatorUserId(input.userId);
  await syncShopWallet(input.userId);

  const wallet = await getShopWallet(input.userId);
  const inventory = await getShopInventory(input.userId);

  if (!unlimited && wallet.balance < item.price) {
    throw new Error("포인트가 부족합니다. 미션을 깨고 포인트를 모아보세요.");
  }

  const owned = inventory.ownedItemIds.includes(item.id);
  if (!item.consumable && owned) {
    throw new Error("이미 보유한 아이템입니다. 인벤토리에서 장착해 주세요.");
  }

  await updateShopUser(input.userId, ({ wallet: currentWallet, inventory: currentInventory }) => {
    if (!unlimited && currentWallet.balance < item.price) {
      throw new Error("포인트가 부족합니다.");
    }

    const charge = unlimited ? 0 : item.price;
    const nextWallet: ShopWallet = {
      ...currentWallet,
      balance: currentWallet.balance - charge,
      lifetimeSpent: currentWallet.lifetimeSpent + charge,
    };

    const nextInventory: ShopInventory = {
      ...currentInventory,
      ownedItemIds: currentInventory.ownedItemIds.includes(item.id)
        ? currentInventory.ownedItemIds
        : [...currentInventory.ownedItemIds, item.id],
      equipped: { ...currentInventory.equipped },
      boosts: { ...currentInventory.boosts },
    };

    if (item.consumable && item.durationDays) {
      applyBoost(nextInventory, item);
    } else if (item.slot && !nextInventory.equipped[item.slot]) {
      nextInventory.equipped[item.slot] = item.id;
    }

    return {
      wallet: nextWallet,
      inventory: nextInventory,
      ledgerEntry: {
        id: randomUUID(),
        userId: input.userId,
        type: "spend",
        amount: charge,
        reason: unlimited
          ? `${item.name} 구매 (운영자 무제한)`
          : `${item.name} 구매`,
        refId: item.id,
        createdAt: new Date().toISOString(),
      },
    };
  });

  return getShopDashboard(input.userId);
}

function applyBoost(inventory: ShopInventory, item: ShopItemDefinition) {
  const days = item.durationDays ?? 7;
  const now = new Date();

  if (item.value === "postHighlight") {
    const base =
      inventory.boosts.postHighlightUntil &&
      new Date(inventory.boosts.postHighlightUntil) > now
        ? new Date(inventory.boosts.postHighlightUntil)
        : now;
    inventory.boosts.postHighlightUntil = addDaysIso(days, base);
  }

  if (item.value === "gallerySpotlight") {
    const base =
      inventory.boosts.gallerySpotlightUntil &&
      new Date(inventory.boosts.gallerySpotlightUntil) > now
        ? new Date(inventory.boosts.gallerySpotlightUntil)
        : now;
    inventory.boosts.gallerySpotlightUntil = addDaysIso(days, base);
  }
}

export async function equipShopItem(input: {
  userId: string;
  itemId: string | null;
  slot: keyof ShopEquipped;
}) {
  await updateShopUser(input.userId, ({ wallet, inventory }) => {
    if (input.itemId) {
      const item = getShopItem(input.itemId);
      if (!item || item.slot !== input.slot) {
        throw new Error("장착할 수 없는 아이템입니다.");
      }
      if (!inventory.ownedItemIds.includes(item.id)) {
        throw new Error("보유하지 않은 아이템입니다.");
      }
      inventory.equipped[input.slot] = item.id;
    } else {
      delete inventory.equipped[input.slot];
    }

    return { wallet, inventory };
  });

  return getShopDashboard(input.userId);
}

export async function getCosmeticLookByUserId(
  userId: string
): Promise<ShopCosmeticLook> {
  const inventory = await getShopInventory(userId);
  return buildCosmeticLook(inventory);
}

/** nickname → cosmetic look (게시글 작성자 표시용) */
export async function getCosmeticLookByNicknameMap(
  nicknames?: string[]
): Promise<Record<string, ShopCosmeticLook>> {
  const [users, inventories] = await Promise.all([
    readUsers(),
    readAllInventories(),
  ]);

  const map: Record<string, ShopCosmeticLook> = {};

  if (nicknames?.length) {
    for (const nickname of nicknames) {
      const user = users.find((entry) => entry.nickname === nickname);
      map[nickname] = user
        ? buildCosmeticLook(inventories[user.id])
        : {};
    }
    return map;
  }

  for (const user of users) {
    const inventory = inventories[user.id];
    if (!inventory) continue;
    const look = buildCosmeticLook(inventory);
    if (
      look.nicknameClassName ||
      look.frameClassName ||
      look.titleBadge ||
      look.postHighlightActive ||
      look.gallerySpotlightActive
    ) {
      map[user.nickname] = look;
    }
  }
  return map;
}

export { emptyWallet, emptyInventory };
