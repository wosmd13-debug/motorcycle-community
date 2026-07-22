#!/usr/bin/env node
/**
 * Merge gallery posts from a backup JSON into the live data/gallery.json.
 * Keeps all posts by id; missing ids from backup are restored.
 */
import fs from "fs";

const [backupPath, targetPath = "data/gallery.json"] = process.argv.slice(2);

if (!backupPath) {
  console.error("Usage: node scripts/merge-gallery-posts.mjs <backup.json> [target.json]");
  process.exit(1);
}

const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
if (!Array.isArray(backup)) {
  console.error("Backup file must be a JSON array.");
  process.exit(1);
}

let target = [];
try {
  const raw = fs.readFileSync(targetPath, "utf8");
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) target = parsed;
} catch {
  target = [];
}

const byId = new Map(target.map((post) => [post.id, post]));
let added = 0;

for (const post of backup) {
  if (!post?.id) continue;
  if (!byId.has(post.id)) {
    byId.set(post.id, post);
    added += 1;
  }
}

if (added === 0) {
  console.log("No missing gallery posts to restore.");
  process.exit(0);
}

const merged = [...byId.values()].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);

fs.writeFileSync(targetPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
console.log(`Restored ${added} gallery post(s) into ${targetPath}`);
