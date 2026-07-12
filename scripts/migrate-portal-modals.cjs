const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const importLine =
  'import PortalModal from "@/components/portal/PortalModal";\n';

const files = [
  { rel: "src/components/board/BoardDetailModal.tsx", onClose: "onClose" },
  { rel: "src/components/board/BoardWriteForm.tsx", onClose: "onClose" },
  { rel: "src/components/board/BoardEditForm.tsx", onClose: "onClose", overlay: "z-[80]" },
  { rel: "src/components/meetups/MeetupDetailModal.tsx", onClose: "onClose" },
  { rel: "src/components/meetups/MeetupWriteForm.tsx", onClose: "onClose" },
  { rel: "src/components/meetups/MeetupEditForm.tsx", onClose: "onClose", overlay: "z-[80]" },
  { rel: "src/components/promo/PromoDetailModal.tsx", onClose: "onClose" },
  { rel: "src/components/promo/PromoWriteForm.tsx", onClose: "onClose" },
  { rel: "src/components/promo/PromoEditForm.tsx", onClose: "onClose", overlay: "z-[80]" },
  { rel: "src/components/marketplace/MarketplaceDetailModal.tsx", onClose: "onClose" },
  { rel: "src/components/marketplace/MarketplaceWriteForm.tsx", onClose: "onClose" },
  { rel: "src/components/marketplace/MarketplaceEditForm.tsx", onClose: "onClose", overlay: "z-[80]" },
  { rel: "src/components/gallery/GalleryDetailModal.tsx", onClose: "onClose" },
  { rel: "src/components/gallery/GalleryUploadForm.tsx", onClose: "onClose" },
  { rel: "src/components/gallery/GalleryEditForm.tsx", onClose: "onClose", overlay: "z-[80]" },
  { rel: "src/components/videos/VideoDetailModal.tsx", onClose: "onClose" },
  { rel: "src/components/videos/VideoUploadForm.tsx", onClose: "onClose" },
  { rel: "src/components/videos/VideoEditForm.tsx", onClose: "onClose", overlay: "z-[80]" },
  { rel: "src/components/cafes/RiderCafeDetailModal.tsx", onClose: "onClose" },
  { rel: "src/components/cafes/RiderCafeUploadForm.tsx", onClose: "onClose" },
  { rel: "src/components/cafes/RiderCafeEditForm.tsx", onClose: "onClose", overlay: "z-[80]" },
  { rel: "src/components/report/ReportButton.tsx", onClose: "handleClose", overlay: "z-[80]" },
  {
    rel: "src/components/auth/RegisterWelcomeModal.tsx",
    onClose: "handleClose",
    overlay: "z-[100]",
    closeOnBackdrop: false,
    labelledBy: "register-welcome-title",
  },
];

function findOverlayCloseIndex(text, openIndex) {
  let depth = 0;
  let i = openIndex;
  const openTag = /<div\b[^>]*>/g;
  const closeTag = /<\/div>/g;

  openTag.lastIndex = openIndex;
  const first = openTag.exec(text);
  if (!first || first.index !== openIndex) return -1;
  depth = 1;
  i = first.index + first[0].length;

  while (depth > 0 && i < text.length) {
    openTag.lastIndex = i;
    closeTag.lastIndex = i;
    const nextOpen = openTag.exec(text);
    const nextClose = closeTag.exec(text);

    if (!nextClose) return -1;

    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      i = nextOpen.index + nextOpen[0].length;
    } else {
      depth -= 1;
      if (depth === 0) return nextClose.index;
      i = nextClose.index + nextClose[0].length;
    }
  }

  return -1;
}

function migrateFile({
  rel,
  onClose,
  overlay = "",
  closeOnBackdrop = true,
  labelledBy,
}) {
  const file = path.join(root, rel);
  let text = fs.readFileSync(file, "utf8");

  if (text.includes("PortalModal")) {
    console.log("skip:", rel);
    return;
  }

  const overlayOpenRegex =
    /<div[\s\S]*?className="portal-modal-overlay[^"]*"[\s\S]*?>/;
  let openMatch = text.match(overlayOpenRegex);
  if (!openMatch) {
    console.warn("overlay not found:", rel);
    return;
  }

  let closeIndex = findOverlayCloseIndex(text, openMatch.index);
  if (closeIndex === -1) {
    console.warn("overlay close not found:", rel);
    return;
  }

  if (!text.includes(importLine.trim())) {
    const useClientEnd = text.indexOf('"use client";');
    const insertAt = text.indexOf("\n", useClientEnd) + 1;
    text = text.slice(0, insertAt) + "\n" + importLine + text.slice(insertAt);
    openMatch = text.match(overlayOpenRegex);
    closeIndex = findOverlayCloseIndex(text, openMatch.index);
  }

  migrateWithIndices(text, file, openMatch, closeIndex, {
    onClose,
    overlay,
    closeOnBackdrop,
    labelledBy,
  });
}

function migrateWithIndices(
  text,
  file,
  openMatch,
  closeIndex,
  { onClose, overlay, closeOnBackdrop, labelledBy }
) {
  const overlayAttr = overlay ? ` overlayClassName="${overlay}"` : "";
  const backdropAttr = closeOnBackdrop ? "" : " closeOnBackdrop={false}";
  const labelAttr = labelledBy ? ` labelledBy="${labelledBy}"` : "";

  const openReplacement = `<PortalModal onClose={${onClose}}${overlayAttr}${backdropAttr}${labelAttr}>`;

  let next = text.slice(0, openMatch.index);
  next += openReplacement;
  next += text.slice(openMatch.index + openMatch[0].length, closeIndex);
  next += "</PortalModal>";
  next += text.slice(closeIndex + "</div>".length);

  next = next.replace(/\s+onClick=\{onClose\}/g, "");
  next = next.replace(
    /\s+onClick=\{\(event\) => event\.stopPropagation\(\)\}/g,
    ""
  );

  fs.writeFileSync(file, next, "utf8");
  console.log("migrated", path.basename(file));
}

for (const entry of files) migrateFile(entry);
console.log("done");
