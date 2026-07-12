const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const files = [
  "src/components/board/BoardDetailModal.tsx",
  "src/components/board/BoardEditForm.tsx",
  "src/components/cafes/RiderCafeUploadForm.tsx",
  "src/components/cafes/RiderCafeEditForm.tsx",
  "src/components/cafes/RiderCafeDetailModal.tsx",
  "src/components/videos/VideoUploadForm.tsx",
  "src/components/videos/VideoEditForm.tsx",
  "src/components/gallery/GalleryDetailModal.tsx",
  "src/components/meetups/MeetupDetailModal.tsx",
  "src/components/meetups/MeetupEditForm.tsx",
  "src/components/meetups/MeetupWriteForm.tsx",
  "src/components/promo/PromoDetailModal.tsx",
  "src/components/marketplace/MarketplaceDetailModal.tsx",
  "src/components/marketplace/MarketplaceWriteForm.tsx",
  "src/components/marketplace/MarketplaceEditForm.tsx",
  "src/components/videos/VideoDetailModal.tsx",
];

for (const rel of files) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;

  let text = fs.readFileSync(file, "utf8");
  let changed = false;

  text = text.replace(
    /<button(\s+type="button")?([\s\S]*?)>(\s*)(닫기|취소)(\s*)<\/button>/g,
    (full, typePart = "", middle, ws1, label, ws2) => {
      if (middle.includes("onClick")) return full;
      const typeAttr = typePart || ' type="button"';
      return `<button${typeAttr}\n            onClick={onClose}${middle}>${ws1}${label}${ws2}</button>`;
    }
  );

  const next = text;
  if (next !== fs.readFileSync(file, "utf8")) {
    fs.writeFileSync(file, next, "utf8");
    console.log("fixed buttons:", rel);
  }
}

console.log("done");
