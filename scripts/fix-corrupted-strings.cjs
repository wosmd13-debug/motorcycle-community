const fs = require("fs");

function patch(file, replacements) {
  let text = fs.readFileSync(file, "utf8");
  for (const [from, to] of replacements) {
    text = text.replace(from, to);
  }
  fs.writeFileSync(file, text, "utf8");
  console.log("patched", file);
}

patch("src/components/gallery/GalleryEditForm.tsx", [
  [/\.filter\(\(item\) => item !== "[^"]+"\)/g, ".filter((item) => item !== galleryCategories[0])"],
]);

patch("src/components/promo/PromoWriteForm.tsx", [
  [/initialCategory = "[^"]+",/g, "initialCategory = promoCategories[1],"],
  [/initialDisplayType = "[^"]+",/g, "initialDisplayType = promoDisplayTypes[0],"],
  [/displayType === "[^"]+"/g, 'displayType === promoDisplayTypes[1]'],
  [/displayType !== "[^"]+"/g, "displayType !== promoDisplayTypes[1]"],
  [/\.filter\(\(item\) => item !== "[^"]+"\)/g, ".filter((item) => item !== promoCategories[0])"],
  [/item !== "[^"]+"/g, "item !== promoCategories[0]"],
]);

patch("src/components/marketplace/MarketplaceWriteForm.tsx", [
  [
    /useState<MarketplaceCategory>\("[^"]+"\)/,
    "useState<MarketplaceCategory>(marketplaceCategories[1])",
  ],
  [
    /useState<MarketplaceCondition>\("[^"]+"\)/,
    "useState<MarketplaceCondition>(marketplaceConditions[0])",
  ],
  [
    /useState<MarketplaceDelivery>\("[^"]+"\)/,
    "useState<MarketplaceDelivery>(marketplaceDeliveries[0])",
  ],
  [/useState<DetailRegion>\("[^"]+"\)/, "useState<DetailRegion>(detailRegions[0])"],
  [/useState\("[^"]+"\)/, 'useState("댓글")'],
  [/\.filter\(\(item\) => item !== "[^"]+"\)/g, ".filter((item) => item !== marketplaceCategories[0])"],
  [/\.filter\(\(item\) => item !== "[^"]+"\)/g, ".filter((item) => item !== filterRegions[0])"],
]);

patch("src/components/marketplace/MarketplaceEditForm.tsx", [
  [/\.filter\(\(value\) => value !== "[^"]+"\)/g, ".filter((value) => value !== marketplaceCategories[0])"],
  [
    /\.filter\(\(value\) => value !== "[^"]+"\)/g,
    ".filter((value) => value !== filterRegions[0])",
  ],
]);

patch("src/components/meetups/MeetupEditForm.tsx", [
  [/\(item\): item is MeetupRegion => item !== "[^"]+"\)/g, "(item): item is MeetupRegion => item !== meetupRegions[0])"],
]);
