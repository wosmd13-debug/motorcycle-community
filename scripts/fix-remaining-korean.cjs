const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function write(rel, content) {
  fs.writeFileSync(path.join(root, rel), content, "utf8");
  console.log("wrote", rel);
}

function patch(rel, replacements) {
  const file = path.join(root, rel);
  let text = fs.readFileSync(file, "utf8");
  for (const [from, to] of replacements) {
    if (!text.includes(from)) {
      console.warn("skip:", rel, from.slice(0, 50));
      continue;
    }
    text = text.split(from).join(to);
  }
  fs.writeFileSync(file, text, "utf8");
  console.log("patched", rel);
}

write(
  "src/components/promo/PromoWriteForm.tsx",
  `"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import PromoWarningBanner from "@/components/promo/PromoWarningBanner";
import {
  promoCategories,
  promoDisplayTypes,
  promoRulesNotice,
  type PromoCategory,
  type PromoDisplayType,
  type PromoPost,
} from "@/lib/promo";
import { parseYouTubeVideoId } from "@/lib/videos";

type PromoWriteFormProps = {
  onClose: () => void;
  onCreated: (post: PromoPost) => void;
  initialCategory?: PromoCategory;
  initialDisplayType?: PromoDisplayType;
};

export default function PromoWriteForm({
  onClose,
  onCreated,
  initialCategory = promoCategories[1],
  initialDisplayType = promoDisplayTypes[0],
}: PromoWriteFormProps) {
  const { user } = useAuth();
  const [category, setCategory] = useState<PromoCategory>(initialCategory);
  const [displayType, setDisplayType] =
    useState<PromoDisplayType>(initialDisplayType);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const youtubePreviewId = parseYouTubeVideoId(youtubeUrl);

  const handleFilesChange = (nextFiles: FileList | null) => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    const selected = nextFiles ? Array.from(nextFiles).slice(0, 5) : [];
    setFiles(selected);
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!agreedToRules) {
      setError("이용 안내에 동의해 주세요.");
      return;
    }

    if (displayType === promoDisplayTypes[1] && files.length === 0) {
      setError("배너 홍보는 대표 이미지 1장을 첨부해야 합니다.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const imageUrls: string[] = [];

      for (const file of files) {
        const uploadData = new FormData();
        uploadData.append("file", file);

        const uploadRes = await fetch("/api/board/upload", {
          method: "POST",
          body: uploadData,
        });
        const uploadJson = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadJson.error ?? "이미지 업로드에 실패했습니다.");
        }

        imageUrls.push(uploadJson.imageUrl as string);
      }

      const createRes = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          category,
          displayType,
          linkUrl,
          youtubeUrl,
          imageUrls,
          agreedToRules: true,
        }),
      });
      const createJson = await createRes.json();

      if (!createRes.ok) {
        throw new Error(createJson.error ?? "홍보글 등록에 실패했습니다.");
      }

      onCreated(createJson.post as PromoPost);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="portal-modal-overlay">
      <form
        onSubmit={handleSubmit}
        className="portal-modal-panel max-w-xl border border-signature/20 p-4 shadow-2xl sm:p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-800">
              {displayType === promoDisplayTypes[1] ? "배너 홍보 등록" : "자유홍보 등록"}
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              {displayType === promoDisplayTypes[1]
                ? "메인 상단 배너에 노출될 대표 이미지를 등록하세요."
                : "채널·매장·행사 등 라이더 대상 홍보를 등록하세요."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-sm text-stone-500 hover:bg-stone-100"
          >
            닫기
          </button>
        </div>

        <div className="mt-4">
          <PromoWarningBanner compact />
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">노출 형태</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {promoDisplayTypes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDisplayType(item)}
                  className={\`rounded-full px-3 py-1.5 text-xs font-semibold transition \${
                    displayType === item
                      ? "bg-signature text-white"
                      : "bg-signature-light/60 text-stone-600 ring-1 ring-signature/20"
                  }\`}
                >
                  {item}
                </button>
              ))}
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">카테고리</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as PromoCategory)}
              className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
            >
              {promoCategories
                .filter((item) => item !== promoCategories[0])
                .map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
            </select>
          </label>

          <Input label="제목" value={title} onChange={setTitle} required />
          <p className="text-sm text-stone-500">
            작성자: <strong>{user?.nickname}</strong>
          </p>

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">홍보 내용</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
              rows={5}
              className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
              placeholder="매장 소개, 연락처, 위치, 이벤트 일정 등을 적어주세요."
            />
          </label>

          <Input
            label="링크 URL (선택)"
            value={linkUrl}
            onChange={setLinkUrl}
            placeholder="https://..."
          />
          <Input
            label="유튜브 URL (선택)"
            value={youtubeUrl}
            onChange={setYoutubeUrl}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          {youtubeUrl && !youtubePreviewId && (
            <p className="text-xs text-red-600">올바른 유튜브 URL을 입력해 주세요.</p>
          )}

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">
              {displayType === promoDisplayTypes[1]
                ? "배너 이미지 (필수, 1장)"
                : "이미지 (선택, 최대 5장)"}
            </span>
            {displayType === promoDisplayTypes[1] && (
              <p className="mt-1 text-xs text-amber-700">
                가로 1200px 이상의 와이드 이미지를 권장합니다. 한 장만 등록할 수 있습니다.
              </p>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple={displayType !== promoDisplayTypes[1]}
              onChange={(event) =>
                handleFilesChange(
                  displayType === promoDisplayTypes[1] && event.target.files
                    ? (() => {
                        const list = new DataTransfer();
                        list.items.add(event.target.files[0]);
                        return list.files;
                      })()
                    : event.target.files
                )
              }
              className="mt-2 block w-full text-sm text-stone-600"
            />
          </label>

          {previews.length > 0 && (
            <div
              className={
                displayType === promoDisplayTypes[1]
                  ? "overflow-hidden rounded-2xl ring-1 ring-amber-200"
                  : "grid grid-cols-3 gap-2"
              }
            >
              {previews.map((url) =>
                displayType === promoDisplayTypes[1] ? (
                  <div
                    key={url}
                    className="relative aspect-[21/7] w-full bg-stone-100"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: \`url(\${url})\` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-stone-950/60 to-transparent" />
                    <p className="absolute bottom-3 left-4 text-sm font-bold text-white">
                      배너 미리보기
                    </p>
                  </div>
                ) : (
                  <div
                    key={url}
                    className="aspect-square bg-cover bg-center ring-1 ring-signature/20"
                    style={{ backgroundImage: \`url(\${url})\` }}
                  />
                )
              )}
            </div>
          )}

          <label className="flex items-start gap-2 border border-red-200 bg-red-50/60 p-3">
            <input
              type="checkbox"
              checked={agreedToRules}
              onChange={(event) => setAgreedToRules(event.target.checked)}
              className="mt-0.5"
            />
            <span className="text-xs leading-5 text-stone-700">
              <strong className="text-red-800">{promoRulesNotice.title}</strong>에
              안내된 금지 사항(음란물, 불법 영상 등)을 숙지했으며, 위반 시{" "}
              <strong className="text-red-800">
                사전 통보 없이 블라인드·삭제·이용 제한
              </strong>
              등 조치에 동의합니다.
            </span>
          </label>
        </div>

        {error && (
          <p className="mt-4 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !agreedToRules}
          className="portal-btn mt-6 w-full py-3 text-sm disabled:opacity-60"
        >
          {submitting
            ? "등록 중..."
            : displayType === promoDisplayTypes[1]
              ? "배너 등록"
              : "홍보글 등록"}
        </button>
      </form>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-stone-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
      />
    </label>
  );
}
`
);

write(
  "src/components/promo/PromoEditForm.tsx",
  `"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  promoCategories,
  promoDisplayTypes,
  type PromoCategory,
  type PromoDisplayType,
  type PromoPost,
} from "@/lib/promo";
import { parseYouTubeVideoId } from "@/lib/videos";

type PromoEditFormProps = {
  post: PromoPost;
  onClose: () => void;
  onUpdated: (post: PromoPost) => void;
};

export default function PromoEditForm({
  post,
  onClose,
  onUpdated,
}: PromoEditFormProps) {
  const { user } = useAuth();
  const isOwner = user?.id === post.authorId || user?.nickname === post.author;
  const [category, setCategory] = useState<PromoCategory>(post.category);
  const [displayType, setDisplayType] =
    useState<PromoDisplayType>(post.displayType);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [linkUrl, setLinkUrl] = useState(post.linkUrl ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(post.youtubeUrl ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>(post.imageUrls);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const youtubePreviewId = parseYouTubeVideoId(youtubeUrl);

  const handleFilesChange = (nextFiles: FileList | null) => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    const selected = nextFiles ? Array.from(nextFiles).slice(0, 5) : [];
    setFiles(selected);
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      displayType === promoDisplayTypes[1] &&
      imageUrls.length === 0 &&
      files.length === 0
    ) {
      setError("배너 홍보는 대표 이미지 1장을 첨부해야 합니다.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const nextImageUrls = [...imageUrls];

      for (const file of files) {
        const uploadData = new FormData();
        uploadData.append("file", file);

        const uploadRes = await fetch("/api/board/upload", {
          method: "POST",
          body: uploadData,
        });
        const uploadJson = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadJson.error ?? "이미지 업로드에 실패했습니다.");
        }

        nextImageUrls.push(uploadJson.imageUrl as string);
      }

      const response = await fetch(\`/api/promo/\${post.id}\`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          title,
          content,
          category,
          displayType,
          linkUrl,
          youtubeUrl,
          imageUrls: nextImageUrls.slice(0, 5),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "홍보글 수정에 실패했습니다.");
      }

      onUpdated(data.post as PromoPost);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="portal-modal-overlay z-[60]">
      <form
        onSubmit={handleSubmit}
        className="portal-modal-panel max-w-xl border border-signature/20 p-4 shadow-2xl sm:p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-signature-dark">
              {isOwner ? "내 홍보글 수정" : "홍보글 수정"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-stone-800">홍보글 편집</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-sm text-stone-500 hover:bg-stone-100"
          >
            닫기
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">노출 형태</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {promoDisplayTypes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDisplayType(item)}
                  className={\`rounded-full px-3 py-1.5 text-xs font-semibold transition \${
                    displayType === item
                      ? "bg-signature text-white"
                      : "bg-signature-light/60 text-stone-600 ring-1 ring-signature/20"
                  }\`}
                >
                  {item}
                </button>
              ))}
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">카테고리</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as PromoCategory)}
              className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
            >
              {promoCategories
                .filter((item) => item !== promoCategories[0])
                .map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
            </select>
          </label>

          <Input label="제목" value={title} onChange={setTitle} required />

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">홍보 내용</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
              rows={5}
              className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
            />
          </label>

          <Input
            label="링크 URL (선택)"
            value={linkUrl}
            onChange={setLinkUrl}
            placeholder="https://..."
          />
          <Input
            label="유튜브 URL (선택)"
            value={youtubeUrl}
            onChange={setYoutubeUrl}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          {youtubeUrl && !youtubePreviewId && (
            <p className="text-xs text-red-600">올바른 유튜브 URL을 입력해 주세요.</p>
          )}

          {imageUrls.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-stone-700">등록된 이미지</p>
              <div className="grid grid-cols-3 gap-2">
                {imageUrls.map((url) => (
                  <div
                    key={url}
                    className="relative aspect-square overflow-hidden bg-stone-100 ring-1 ring-signature/20"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: \`url(\${url})\` }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setImageUrls((current) => current.filter((item) => item !== url))
                      }
                      className="absolute right-1 top-1 rounded bg-stone-900/70 px-2 py-0.5 text-[10px] font-semibold text-white"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">
              {displayType === promoDisplayTypes[1]
                ? "배너 이미지 추가"
                : "이미지 추가 (최대 5장)"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple={displayType !== promoDisplayTypes[1]}
              onChange={(event) =>
                handleFilesChange(
                  displayType === promoDisplayTypes[1] && event.target.files
                    ? (() => {
                        const list = new DataTransfer();
                        list.items.add(event.target.files[0]);
                        return list.files;
                      })()
                    : event.target.files
                )
              }
              className="mt-2 block w-full text-sm text-stone-600"
            />
          </label>

          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((url) => (
                <div
                  key={url}
                  className="aspect-square bg-cover bg-center ring-1 ring-signature/20"
                  style={{ backgroundImage: \`url(\${url})\` }}
                />
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-4 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="portal-btn mt-6 w-full py-3 text-sm disabled:opacity-60"
        >
          {submitting ? "저장 중..." : "변경 저장"}
        </button>
      </form>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-stone-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm outline-none focus:border-signature"
      />
    </label>
  );
}
`
);

patch("src/components/meetups/MeetupDetailModal.tsx", [
  [
    'err instanceof Error ? err.message : "참가 신청에 실패했습니다."\n      );\n    }\n  };\n\n  return (',
    'err instanceof Error ? err.message : "참가 취소에 실패했습니다."\n      );\n    }\n  };\n\n  return (',
  ],
  ['<p className="text-xs font-semibold text-signature-dark">수정</p>', '<p className="text-xs font-semibold text-signature-dark">일시</p>'],
  [
    '<section>\n            <p className="text-sm font-semibold text-stone-700">모임 장소</p>\n            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-600">',
    '<section>\n            <p className="text-sm font-semibold text-stone-700">모임 소개</p>\n            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-600">',
  ],
  [
    '<section className="rounded-2xl border border-stone-100 bg-stone-50 p-4">\n              <p className="text-sm font-semibold text-stone-700">모임 장소</p>',
    '<section className="rounded-2xl border border-stone-100 bg-stone-50 p-4">\n              <p className="text-sm font-semibold text-stone-700">연락 수단</p>',
  ],
  [
    '>\n                    ??\n                  </button>\n                  <button\n                    type="button"\n                    onClick={onDelete}',
    '>\n                    수정\n                  </button>\n                  <button\n                    type="button"\n                    onClick={onDelete}',
  ],
  [
    'className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50"\n              >\n                ??\n              </button>',
    'className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50"\n              >\n                닫기\n              </button>',
  ],
]);

for (const rel of [
  "src/components/marketplace/MarketplaceWriteForm.tsx",
  "src/components/marketplace/MarketplaceEditForm.tsx",
  "src/components/gallery/GalleryEditForm.tsx",
]) {
  const file = path.join(root, rel);
  let text = fs.readFileSync(file, "utf8");
  text = text.replace(
    /throw new Error\(uploadJson\.error \?\? "[^"]*"\);/g,
    'throw new Error(uploadJson.error ?? "이미지 업로드에 실패했습니다.");'
  );
  if (rel.includes("MarketplaceWrite")) {
    text = text.replace(
      /throw new Error\(data\.error \?\? "[^"]*"\);/g,
      'throw new Error(data.error ?? "매물 등록에 실패했습니다.");'
    );
  } else if (rel.includes("MarketplaceEdit")) {
    text = text.replace(
      /throw new Error\(data\.error \?\? "[^"]*"\);/g,
      'throw new Error(data.error ?? "매물 수정에 실패했습니다.");'
    );
  } else {
    text = text.replace(
      /throw new Error\(data\.error \?\? "[^"]*"\);/g,
      'throw new Error(data.error ?? "게시물 수정에 실패했습니다.");'
    );
  }
  fs.writeFileSync(file, text, "utf8");
  console.log("fixed errors in", rel);
}

console.log("done");
