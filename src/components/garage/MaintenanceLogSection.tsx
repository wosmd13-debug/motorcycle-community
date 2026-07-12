"use client";

import { useState } from "react";
import {
  formatGarageCost,
  formatGarageDate,
  maintenanceCategories,
  maintenanceCategoryLabels,
  type MaintenanceCategory,
  type MaintenanceLog,
  type UserBikeGarage,
} from "@/lib/bike-garage";

type MaintenanceLogSectionProps = {
  garage: UserBikeGarage;
  onChanged: (garage: UserBikeGarage) => void;
};

export default function MaintenanceLogSection({
  garage,
  onChanged,
}: MaintenanceLogSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (log: MaintenanceLog) => {
    if (!window.confirm("이 정비 기록을 삭제할까요?")) return;

    setDeletingId(log.id);
    setError(null);

    try {
      const response = await fetch(`/api/bike-garage/logs/${log.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "삭제에 실패했습니다.");
      }

      onChanged(data.garage as UserBikeGarage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="portal-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-stone-800">정비 일지</h2>
            <p className="mt-1 text-xs text-stone-500">
              총 {garage.logs.length}건 · 비용·부품·정비소 기록
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            className="portal-btn px-4 py-2 text-sm"
          >
            {showForm ? "닫기" : "+ 정비 기록"}
          </button>
        </div>

        {showForm && (
          <MaintenanceLogForm
            defaultMileage={garage.bike?.currentMileage ?? 0}
            onCreated={(nextGarage) => {
              onChanged(nextGarage);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {garage.logs.length === 0 ? (
        <div className="portal-panel border-dashed px-6 py-12 text-center">
          <p className="text-sm text-stone-500">아직 정비 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {garage.logs.map((log) => (
            <article
              key={log.id}
              className="portal-panel p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold text-sky-800">
                      {maintenanceCategoryLabels[log.category]}
                    </span>
                    <h3 className="font-bold text-stone-800">{log.title}</h3>
                  </div>
                  <p className="mt-2 text-sm text-stone-600">
                    {formatGarageDate(log.date)} · {log.mileage.toLocaleString()}km
                  </p>
                  {log.shop && (
                    <p className="mt-1 text-sm text-stone-500">정비소: {log.shop}</p>
                  )}
                  {log.parts && (
                    <p className="mt-1 text-sm text-stone-500">부품: {log.parts}</p>
                  )}
                  {log.memo && (
                    <p className="mt-2 text-sm leading-6 text-stone-600">{log.memo}</p>
                  )}
                </div>
                <div className="text-right">
                  {log.cost != null && (
                    <p className="text-sm font-bold text-stone-800">
                      {formatGarageCost(log.cost)}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleDelete(log)}
                    disabled={deletingId === log.id}
                    className="mt-2 text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
                  >
                    {deletingId === log.id ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function MaintenanceLogForm({
  defaultMileage,
  onCreated,
  onCancel,
}: {
  defaultMileage: number;
  onCreated: (garage: UserBikeGarage) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mileage, setMileage] = useState(String(defaultMileage));
  const [category, setCategory] = useState<MaintenanceCategory>("engine_oil");
  const [title, setTitle] = useState("");
  const [shop, setShop] = useState("");
  const [cost, setCost] = useState("");
  const [parts, setParts] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/bike-garage/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          mileage,
          category,
          title,
          shop,
          cost: cost || null,
          parts,
          memo,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "등록에 실패했습니다.");
      }

      onCreated(data.garage as UserBikeGarage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-signature/10 pt-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-stone-600">정비 날짜</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1.5 w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
            required
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-stone-600">주행거리 (km)</span>
          <input
            type="number"
            min={0}
            value={mileage}
            onChange={(event) => setMileage(event.target.value)}
            className="mt-1.5 w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
            required
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-stone-600">항목</span>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as MaintenanceCategory)
            }
            className="mt-1.5 w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
          >
            {maintenanceCategories.map((item) => (
              <option key={item} value={item}>
                {maintenanceCategoryLabels[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-stone-600">제목</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="비워두면 항목명 사용"
            className="mt-1.5 w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-stone-600">정비소</span>
          <input
            value={shop}
            onChange={(event) => setShop(event.target.value)}
            className="mt-1.5 w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-stone-600">비용 (원)</span>
          <input
            type="number"
            min={0}
            value={cost}
            onChange={(event) => setCost(event.target.value)}
            className="mt-1.5 w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-stone-600">교체 부품</span>
        <input
          value={parts}
          onChange={(event) => setParts(event.target.value)}
          placeholder="예: Motul 7100 10W-40, DID 체인"
          className="mt-1.5 w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-stone-600">메모</span>
        <textarea
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          rows={3}
          className="mt-1.5 w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
        />
      </label>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="portal-btn px-4 py-2 text-sm disabled:opacity-60"
        >
          {submitting ? "등록 중..." : "기록 저장"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600"
        >
          취소
        </button>
      </div>
    </form>
  );
}
