const fs = require("fs");
const path = require("path");

const file = path.join(
  __dirname,
  "..",
  "src/components/marketplace/MarketplaceDetailModal.tsx"
);
let text = fs.readFileSync(file, "utf8");

text = text.replace(
  /<button\s+type="button"\s+className="rounded-full px-3 py-1 text-sm text-stone-500 hover:bg-stone-100"\s*>[\s\S]*?<\/button>/,
  '<button\n              type="button"\n              onClick={onClose}\n              className="rounded-full px-3 py-1 text-sm text-stone-500 hover:bg-stone-100"\n            >\n              닫기\n            </button>'
);

text = text.replace(
  /\{copied \? "[^"]*" : "[^"]*"\}/,
  '{copied ? "링크 복사됨" : "공유 링크"}'
);

text = text.replace(
  /setCommentError\(\s*"[^"]*"\s*\);/,
  'setCommentError("댓글을 작성하려면 로그인이 필요합니다.");'
);

text = text.replace(
  /err instanceof Error \? err\.message : "[^"]*"/,
  'err instanceof Error ? err.message : "댓글 등록에 실패했습니다."'
);

text = text.replace(
  /\{item\.seller\}[^·{]+\{formatMarketplaceDate/,
  "{item.seller} · {formatMarketplaceDate"
);

fs.writeFileSync(file, text, "utf8");
console.log("fixed marketplace detail modal");
