const fs = require("fs");

const files = [
  "src/components/gallery/GalleryEditForm.tsx",
  "src/components/promo/PromoWriteForm.tsx",
  "src/components/marketplace/MarketplaceWriteForm.tsx",
  "src/components/marketplace/MarketplaceEditForm.tsx",
  "src/components/marketplace/MarketplaceDetailModal.tsx",
  "src/components/meetups/MeetupEditForm.tsx",
];

for (const file of files) {
  let text = fs.readFileSync(file, "utf8");

  text = text.replace(
    /\.filter\(\((item|value)\) => \1 !== "[^"]+"\)/g,
    '.filter(($1) => $1 !== galleryCategories[0])'
  );

  fs.writeFileSync(file, text, "utf8");
  console.log("patched filters in", file);
}
