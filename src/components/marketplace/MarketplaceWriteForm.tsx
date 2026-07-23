"use client";

import PortalModal from "@/components/portal/PortalModal";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import MarketplaceTradeNotice from "@/components/marketplace/MarketplaceTradeNotice";
import {
  marketplaceCategories,
  marketplaceConditions,
  marketplaceDeliveries,
  marketplaceRegions,
  type MarketplaceCategory,
  type MarketplaceCondition,
  type MarketplaceDelivery,
  type MarketplaceItem,
} from "@/lib/marketplace";
import type { DetailRegion } from "@/lib/regions";

type MarketplaceWriteFormProps = {
  onClose: () => void;
  onCreated: (item: MarketplaceItem) => void;
};

export default function MarketplaceWriteForm({
  onClose,
  onCreated,
}: MarketplaceWriteFormProps) {
  const { user } = useAuth();
  const [category, setCategory] = useState<MarketplaceCategory>(
    marketplaceCategories[1]
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<MarketplaceCondition>(
    marketplaceConditions[0]
  );
  const [delivery, setDelivery] = useState<MarketplaceDelivery>(
    marketplaceDeliveries[0]
  );
  const [region, setRegion] = useState<DetailRegion>(
    marketplaceRegions[1] as DetailRegion
  );
  const [location, setLocation] = useState("");
  const [contactMethod, setContactMethod] = useState("댓글");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChange = (nextFiles: FileList | null) => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    const selected = nextFiles ? Array.from(nextFiles).slice(0, 5) : [];
    setFiles(selected);
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const imageUrls: string[] = [];

      for (const file of files) {
        const uploadData = new FormData();
        uploadData.append("file", file);

        const uploadRes = await fetch("/api/marketplace/upload", {
          method: "POST",
          body: uploadData,
        });
        const uploadJson = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadJson.error ?? "이미지 업로드에 실패했습니다.");
        }

        imageUrls.push(uploadJson.imageUrl as string);
      }

      const response = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          price: price.trim() ? Number(price) : 0,
          condition,
          delivery,
          region,
          location,
          contactMethod,
          imageUrls,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "매물 등록에 실패했습니다.");
      }

      onCreated(data.item as MarketplaceItem);
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
        className="portal-modal-panel max-h-[92vh] max-w-2xl overflow-y-auto p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-800">중고거래 등록</h2>
            <p className="mt-1 text-xs text-stone-500">
              작성자: <strong>{user?.nickname}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-stone-500 hover:bg-stone-100"
          >
            닫기
          </button>
        </div>

        <div className="mt-4">
          <MarketplaceTradeNotice compact />
        </div>

        <div className="mt-6 space-y-4">
          <Field label="카테고리">
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as MarketplaceCategory)
              }
              className={inputClass}
            >
              {marketplaceCategories
                .filter((item) => item !== marketplaceCategories[0])
                .map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
            </select>
          </Field>

          <Field label="제목">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              placeholder="예: SHOEI 헬멧 M사이즈 판매합니다"
              className={inputClass}
            />
          </Field>

          <Field label="가격 (원, 0이면 가격 문의)">
            <input
              type="number"
              min={0}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="350000"
              className={inputClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="제품 상태">
              <select
                value={condition}
                onChange={(event) =>
                  setCondition(event.target.value as MarketplaceCondition)
                }
                className={inputClass}
              >
                {marketplaceConditions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="거래 방식">
              <select
                value={delivery}
                onChange={(event) =>
                  setDelivery(event.target.value as MarketplaceDelivery)
                }
                className={inputClass}
              >
                {marketplaceDeliveries.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="지역">
              <select
                value={region}
                onChange={(event) =>
                  setRegion(event.target.value as DetailRegion)
                }
                className={inputClass}
              >
                {marketplaceRegions
                  .filter((item) => item !== marketplaceRegions[0])
                  .map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
              </select>
            </Field>

            <Field label="거래 장소 (예)">
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                required
                placeholder="예: 서울 강남구"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="연락 방법">
            <input
              value={contactMethod}
              onChange={(event) => setContactMethod(event.target.value)}
              placeholder="댓글로 문의 주세요"
              className={inputClass}
            />
          </Field>

          <Field label="제품 설명">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={5}
              placeholder="사용 기간, 상태, 포함 구성품, 거래 조건을 적어주세요."
              className={inputClass}
            />
          </Field>

          <Field label="사진 (최대 5장)">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => handleFilesChange(event.target.files)}
              className="block w-full text-sm text-stone-600"
            />
          </Field>

          {previews.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {previews.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="h-32 w-full rounded-2xl object-cover"
                />
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="portal-btn mt-6 w-full py-3 text-sm disabled:opacity-60"
        >
          {submitting ? "등록 중..." : "매물 등록"}
        </button>
      </form>
    </PortalModal>
  );
}

const inputClass =
  "mt-2 w-full rounded-2xl border border-signature/20 bg-signature-light/50 px-4 py-3 text-sm outline-none focus:border-signature";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-stone-700">{label}</span>
      {children}
    </label>
  );
}
