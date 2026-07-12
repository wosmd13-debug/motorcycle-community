"use client";

import { useState } from "react";
import PortalModal from "@/components/portal/PortalModal";
import PromoBusinessFields, {
  emptyPromoBusinessValues,
  type PromoBusinessFormValues,
} from "@/components/promo/PromoBusinessFields";
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
  const [businessInfo, setBusinessInfo] = useState<PromoBusinessFormValues>(
    emptyPromoBusinessValues()
  );
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
          ...businessInfo,
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
    <PortalModal onClose={onClose}>
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
              placeholder="매장 소개, 이벤트 내용, 할인 안내 등을 적어주세요."
            />
          </label>

          <PromoBusinessFields
            category={category}
            values={businessInfo}
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
                      style={{ backgroundImage: `url(${url})` }}
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
                    style={{ backgroundImage: `url(${url})` }}
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
