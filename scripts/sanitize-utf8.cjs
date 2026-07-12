const fs = require("fs");

const files = [
  "src/components/promo/PromoWriteForm.tsx",
  "src/components/meetups/MeetupEditForm.tsx",
  "src/components/marketplace/MarketplaceWriteForm.tsx",
  "src/components/marketplace/MarketplaceEditForm.tsx",
  "src/components/marketplace/MarketplaceDetailModal.tsx",
];

for (const file of files) {
  const buffer = fs.readFileSync(file);
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  fs.writeFileSync(file, text, "utf8");
  console.log("sanitized", file);
}
