import { promises as fs } from "fs";
import path from "path";
import {
  emptyInventory,
  emptyWallet,
  type ShopFileData,
  type ShopInventory,
  type ShopLedgerEntry,
  type ShopWallet,
} from "@/lib/shop";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "shop.json");

const emptyData = (): ShopFileData => ({
  wallets: {},
  inventories: {},
  ledger: [],
});

function cloneInventory(inventory: ShopInventory): ShopInventory {
  return {
    ownedItemIds: [...inventory.ownedItemIds],
    equipped: { ...inventory.equipped },
    boosts: { ...inventory.boosts },
  };
}

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(emptyData(), null, 2), "utf8");
  }
}

export async function readShopData(): Promise<ShopFileData> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw) as Partial<ShopFileData>;
  return {
    wallets:
      parsed.wallets && typeof parsed.wallets === "object" ? parsed.wallets : {},
    inventories:
      parsed.inventories && typeof parsed.inventories === "object"
        ? parsed.inventories
        : {},
    ledger: Array.isArray(parsed.ledger) ? parsed.ledger : [],
  };
}

async function writeShopData(data: ShopFileData) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function getShopWallet(userId: string): Promise<ShopWallet> {
  const data = await readShopData();
  return data.wallets[userId] ?? emptyWallet();
}

export async function getShopInventory(userId: string): Promise<ShopInventory> {
  const data = await readShopData();
  return data.inventories[userId] ?? emptyInventory();
}

export async function getUserLedger(
  userId: string,
  limit = 30
): Promise<ShopLedgerEntry[]> {
  const data = await readShopData();
  return data.ledger
    .filter((entry) => entry.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function updateShopUser(
  userId: string,
  updater: (ctx: {
    wallet: ShopWallet;
    inventory: ShopInventory;
    ledger: ShopLedgerEntry[];
  }) => {
    wallet: ShopWallet;
    inventory: ShopInventory;
    ledgerEntry?: ShopLedgerEntry;
  }
) {
  const data = await readShopData();
  const wallet = { ...(data.wallets[userId] ?? emptyWallet()) };
  const inventory = cloneInventory(data.inventories[userId] ?? emptyInventory());
  const result = updater({ wallet, inventory, ledger: data.ledger });

  data.wallets[userId] = result.wallet;
  data.inventories[userId] = result.inventory;
  if (result.ledgerEntry) {
    data.ledger.push(result.ledgerEntry);
  }
  await writeShopData(data);
  return result;
}

export async function sumShopSpentByUser(): Promise<Map<string, number>> {
  const data = await readShopData();
  const map = new Map<string, number>();
  for (const [userId, wallet] of Object.entries(data.wallets)) {
    const spent = Math.max(0, wallet.lifetimeSpent ?? 0);
    if (spent > 0) map.set(userId, spent);
  }
  return map;
}

export async function readAllInventories(): Promise<
  Record<string, ShopInventory>
> {
  const data = await readShopData();
  return data.inventories;
}
