"use client";

import PortalModal from "@/components/portal/PortalModal";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  marketplaceCategories,
  marketplaceConditions,
  marketplaceDeliveries,
  marketplaceRegions,
  marketplaceStatuses,
  type MarketplaceCategory,
  type MarketplaceCondition,
  type MarketplaceDelivery,
  type MarketplaceItem,
  type MarketplaceStatus,
} from "@/lib/marketplace";
import type { DetailRegion } from "@/lib/regions";

type MarketplaceEditFormProps = {
  item: MarketplaceItem;
  onClose: () => void;
  onUpdated: (item: MarketplaceItem) => void;
};

export default function MarketplaceEditForm({
  item,
  onClose,
  onUpdated,
}: MarketplaceEditFormProps) {
  const { user } = useAuth();
  const isOwner = user?.id === item.sellerId;
  const [category, setCategory] = useState<MarketplaceCategory>(item.category);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [price, setPrice] = useState(String(item.price || ""));
  const [condition, setCondition] = useState<MarketplaceCondition>(item.condition);
  const [status, setStatus] = useState<MarketplaceStatus>(item.status);
  const [delivery, setDelivery] = useState<MarketplaceDelivery>(item.delivery);
  const [region, setRegion] = useState<DetailRegion>(item.region);
  const [location, setLocation] = useState(item.location);
  const [contactMethod, setContactMethod] = useState(item.contactMethod ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>(item.imageUrls);
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
      const nextImageUrls = [...imageUrls];

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

        nextImageUrls.push(uploadJson.imageUrl as string);
      }

      const response = await fetch(`/api/marketplace/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          title,
          description,
          category,
          price: price.trim() ? Number(price) : 0,
          condition,
          status,
          delivery,
          region,
          location,
          contactMethod,
          imageUrls: nextImageUrls.slice(0, 5),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "매물 수정에 실패했습니다.");
      }

      onUpdated(data.item as MarketplaceItem);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "������ �����߽��ϴ�.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortalModal onClose={onClose} overlayClassName="z-[80]">
      <form
        onSubmit={handleSubmit}
        className="portal-modal-panel max-h-[92vh] max-w-2xl overflow-y-auto p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-signature-dark">
              {isOwner ? "�� �Ź� ����" : "��� ����"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-stone-800">�Ź� ����</h2>
          </div>
          <button
            type="button"
            className="rounded-full px-3 py-1 text-sm text-stone-500 hover:bg-stone-100"
          >
            �ݱ�
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <Field label="ī�װ���">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as MarketplaceCategory)}
              className={inputClass}
            >
              {marketplaceCategories
                .filter((value) => value !== marketplaceCategories[0])
                .map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
            </select>
          </Field>

          <Field label="�Ǹ� ����">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as MarketplaceStatus)}
              className={inputClass}
            >
              {marketplaceStatuses.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>

          <Field label="����">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className={inputClass}
            />
          </Field>

          <Field label="���� (��)">
            <input
              type="number"
              min={0}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="��ǰ ����">
              <select
                value={condition}
                onChange={(event) =>
                  setCondition(event.target.value as MarketplaceCondition)
                }
                className={inputClass}
              >
                {marketplaceConditions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="�ŷ� ���">
              <select
                value={delivery}
                onChange={(event) =>
                  setDelivery(event.target.value as MarketplaceDelivery)
                }
                className={inputClass}
              >
                {marketplaceDeliveries.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="�ǿ�">
              <select
                value={region}
                onChange={(event) => setRegion(event.target.value as DetailRegion)}
                className={inputClass}
              >
                {marketplaceRegions
                  .filter((value) => value !== marketplaceRegions[0])
                  .map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
              </select>
            </Field>

            <Field label="�ŷ� ����">
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                required
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="���� ���">
            <input
              value={contactMethod}
              onChange={(event) => setContactMethod(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="��ǰ ����">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={5}
              className={inputClass}
            />
          </Field>

          {imageUrls.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {imageUrls.map((url) => (
                <div key={url} className="relative overflow-hidden rounded-2xl">
                  <img src={url} alt="" className="h-32 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() =>
                      setImageUrls((current) => current.filter((item) => item !== url))
                    }
                    className="absolute right-2 top-2 rounded-full bg-red-600 px-2 py-1 text-[10px] font-bold text-white"
                  >
                    ����
                  </button>
                </div>
              ))}
            </div>
          )}

          <Field label="���� �߰�">
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
          {submitting ? "���� ��..." : "���� ����"}
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
