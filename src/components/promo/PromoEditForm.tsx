"use client";

import { useState } from "react";
import PortalModal from "@/components/portal/PortalModal";
import PromoBusinessFields, {
  emptyPromoBusinessValues,
  type PromoBusinessFormValues,
} from "@/components/promo/PromoBusinessFields";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  promoCategories,
  promoDisplayTypes,
  promoBusinessValuesFromPost,
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
  const initialBusiness = promoBusinessValuesFromPost(post);
  const [businessInfo, setBusinessInfo] = useState<PromoBusinessFormValues>({
    address: initialBusiness.address,
    phone: initialBusiness.phone,
    businessWeeklyHours: initialBusiness.businessWeeklyHours,
    businessStatus: initialBusiness.businessStatus,
  });
  const [legacyBusinessHours] = useState(initialBusiness.legacyBusinessHours);
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

      const response = await fetch(`/api/promo/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          title,
          content,
          category,
          displayType,
          ...businessInfo,
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
    <PortalModal onClose={onClose} overlayClassName="z-[80]">
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
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    displayType === item
                      ? "bg-signature text-white"
                      : "bg-signature-light/60 text-stone-600 ring-1 ring-signature/20"
                  }`}
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

          <PromoBusinessFields
            category={category}
            values={businessInfo}
            legacyBusinessHours={legacyBusinessHours || undefined}
            onChange={(key, value) =>
              setBusinessInfo((current) => ({ ...current, [key]: value }))
            }
          />

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
                      style={{ backgroundImage: `url(${url})` }}
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
                  style={{ backgroundImage: `url(${url})` }}
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
    </PortalModal>
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
