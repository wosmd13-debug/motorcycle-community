const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function patch(rel, replacements) {
  const file = path.join(root, rel);
  let text = fs.readFileSync(file, "utf8");
  for (const [from, to] of replacements) {
    text = text.split(from).join(to);
  }
  fs.writeFileSync(file, text, "utf8");
  console.log("patched", rel);
}

patch("src/components/promo/PromoDetailModal.tsx", [
  [
    `              <button
                type="button"
                className="shrink-0 px-3 py-1 text-sm text-stone-500 hover:bg-stone-100"
              >
                ??
              </button>`,
    `              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full px-3 py-1 text-sm text-stone-500 hover:bg-stone-100"
              >
                닫기
              </button>`,
  ],
  ['setCommentError("??? ????? ???? ?????.");', 'setCommentError("댓글을 작성하려면 로그인이 필요합니다.");'],
  ['setCommentError("?? ??? ??? ???.");', 'setCommentError("댓글 내용을 입력해 주세요.");'],
  ['err.message : "?? ??? ??????."', 'err.message : "댓글 등록에 실패했습니다."'],
  ["?? ??", "배너 홍보"],
  [">??<", ">수정<"],
  ['{deleting ? "?? ?..." : "??"}', '{deleting ? "삭제 중..." : "삭제"}'],
  ["{post.author} ? {formatPromoDate", "{post.author} · {formatPromoDate"],
]);

patch("src/components/marketplace/MarketplaceDetailModal.tsx", [
  [
    `            <button
              type="button"
              className="rounded-full px-3 py-1 text-sm text-stone-500 hover:bg-stone-100"
            >
              ݱ
            </button>`,
    `            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-3 py-1 text-sm text-stone-500 hover:bg-stone-100"
            >
              닫기
            </button>`,
  ],
  [
    'setCommentError(" ۼϷα ʿմϴ.");',
    'setCommentError("댓글을 작성하려면 로그인이 필요합니다.");',
  ],
  [
    'err.message : " Ͽ ߽ϴ."',
    'err.message : "댓글 등록에 실패했습니다."',
  ],
  [
    "{item.seller}  {formatMarketplaceDate",
    "{item.seller} · {formatMarketplaceDate",
  ],
  ['{copied ? "ũ " : " ũ"}', '{copied ? "링크 복사됨" : "공유 링크"}'],
]);

patch("src/components/videos/VideoDetailModal.tsx", [
  [
    `          <button
            type="button"
            className="mt-8 w-full bg-stone-100 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-200"
          >
            ??
          </button>`,
    `          <button
            type="button"
            onClick={onClose}
            className="mt-8 w-full bg-stone-100 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-200"
          >
            닫기
          </button>`,
  ],
  ['?? {video.likes}', '추천 {video.likes}'],
  ['<span>?? {video.views}</span>', '<span>조회 {video.views}</span>'],
  ['<span>?? {video.comments.length}</span>', '<span>댓글 {video.comments.length}</span>'],
  ['????? ??', '유튜브에서 보기'],
  ['<span>?? {video.submitter}</span>', '<span>등록 {video.submitter}</span>'],
  ['?? {video.comments.length}', '댓글 {video.comments.length}'],
  ['{user.nickname}?? ?? ??', '{user.nickname}님으로 작성'],
  ['placeholder="??? ?????."', 'placeholder="댓글을 입력하세요."'],
  ['{commenting ? "?? ?..." : "?? ??"}', '{commenting ? "등록 중..." : "댓글 등록"}'],
  ['???', '로그인'],
  ['? ??? ??? ? ????.', '하면 댓글을 남길 수 있습니다.'],
  ['? ??? ?????.', '아직 댓글이 없습니다.'],
  ['err.message : "?? ??? ??????."', 'err.message : "댓글 등록에 실패했습니다."'],
  ['setCommentError("??? ????? ???? ?????.");', 'setCommentError("댓글을 작성하려면 로그인이 필요합니다.");'],
  ['setCommentError("?? ??? ??? ???.");', 'setCommentError("댓글 내용을 입력해 주세요.");'],
]);

console.log("done");
