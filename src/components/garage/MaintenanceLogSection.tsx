"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatGarageCost,
  formatGarageDate,
  formatGarageKm,
  maintenanceCategories,
  maintenanceCategoryBadgeClass,
  maintenanceCategoryLabels,
  toGarageDateInput,
  todayGarageDate,
  type MaintenanceCategory,
  type MaintenanceLog,
  type MaintenanceReminder,
  type UserBikeGarage,
} from "@/lib/bike-garage";

type GarageChangePayload = {
  garage: UserBikeGarage;
  reminders?: MaintenanceReminder[];
};

type MaintenanceLogSectionProps = {
  garage: UserBikeGarage;
  draftCategory?: MaintenanceCategory | null;
  draftNonce?: number;
  onChanged: (payload: GarageChangePayload) => void;
};

export default function MaintenanceLogSection({
  garage,
  draftCategory,
  draftNonce,
  onChanged,
}: MaintenanceLogSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLog | null>(null);
  const [formCategory, setFormCategory] = useState<MaintenanceCategory>("engine_oil");
  const [filter, setFilter] = useState<MaintenanceCategory | "all">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draftCategory || draftNonce == null) return;
    setEditingLog(null);
    setFormCategory(draftCategory);
    setShowForm(true);
  }, [draftCategory, draftNonce]);

  const filteredLogs = useMemo(
    () =>
      filter === "all"
        ? garage.logs
        : garage.logs.filter((log) => log.category === filter),
    [filter, garage.logs]
  );

  const groupedLogs = useMemo(() => groupLogsByMonth(filteredLogs), [filteredLogs]);

  const totalCost = useMemo(
    () =>
      filteredLogs.reduce((sum, log) => sum + (typeof log.cost === "number" ? log.cost : 0), 0),
    [filteredLogs]
  );

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

      onChanged({
        garage: data.garage as UserBikeGarage,
        reminders: data.reminders as MaintenanceReminder[] | undefined,
      });
      if (editingLog?.id === log.id) {
        setEditingLog(null);
        setShowForm(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const openCreate = (category: MaintenanceCategory = "engine_oil") => {
    setEditingLog(null);
    setFormCategory(category);
    setShowForm(true);
  };

  const openEdit = (log: MaintenanceLog) => {
    setEditingLog(log);
    setFormCategory(log.category);
    setShowForm(true);
  };

  return (
    <section className="space-y-4">
      <div className="portal-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-stone-800">정비 일지</h2>
            <p className="mt-1 text-xs text-stone-500">
              총 {garage.logs.length}건
              {totalCost > 0 && ` · ${filter === "all" ? "전체" : maintenanceCategoryLabels[filter]} 비용 ${formatGarageCost(totalCost)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (showForm && !editingLog) {
                setShowForm(false);
                return;
              }
              openCreate(formCategory);
            }}
            className="portal-btn px-4 py-2 text-sm"
          >
            {showForm && !editingLog ? "닫기" : "+ 정비 기록"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["engine_oil", "chain", "tire", "brake"] as MaintenanceCategory[]).map(
            (category) => (
              <button
                key={category}
                type="button"
                onClick={() => openCreate(category)}
                className="rounded-full border border-signature/20 bg-signature-light/40 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-signature hover:bg-white"
              >
                {maintenanceCategoryLabels[category]} 빠르게 기록
              </button>
            )
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <FilterChip
            active={filter === "all"}
            label={`전체 ${garage.logs.length}`}
            onClick={() => setFilter("all")}
          />
          {maintenanceCategories.map((category) => {
            const count = garage.logs.filter((log) => log.category === category).length;
            if (count === 0 && filter !== category) return null;
            return (
              <FilterChip
                key={category}
                active={filter === category}
                label={`${maintenanceCategoryLabels[category]} ${count}`}
                onClick={() => setFilter(category)}
              />
            );
          })}
        </div>

        {showForm && (
          <MaintenanceLogForm
            key={editingLog?.id ?? `new-${formCategory}-${draftNonce ?? 0}`}
            defaultMileage={garage.bike?.currentMileage ?? 0}
            initialCategory={editingLog?.category ?? formCategory}
            editingLog={editingLog}
            onSaved={(payload) => {
              onChanged(payload);
              setShowForm(false);
              setEditingLog(null);
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingLog(null);
            }}
          />
        )}
      </div>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {garage.logs.length === 0 ? (
        <div className="portal-panel border-dashed px-6 py-12 text-center">
          <p className="text-sm font-semibold text-stone-700">아직 정비 기록이 없습니다.</p>
          <p className="mt-2 text-xs text-stone-500">
            위 버튼으로 엔진오일·체인·타이어·브레이크를 바로 남길 수 있습니다.
          </p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="portal-panel border-dashed px-6 py-10 text-center text-sm text-stone-500">
          이 항목의 기록이 없습니다.
        </div>
      ) : (
        <div className="space-y-5">
          {groupedLogs.map((group) => (
            <div key={group.label} className="space-y-3">
              <p className="px-1 text-xs font-bold tracking-wide text-stone-500">
                {group.label}
              </p>
              {group.logs.map((log) => (
                <article key={log.id} className="portal-panel p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${maintenanceCategoryBadgeClass(log.category)}`}
                        >
                          {maintenanceCategoryLabels[log.category]}
                        </span>
                        <h3 className="font-bold text-stone-800">{log.title}</h3>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-stone-700">
                        {formatGarageDate(log.date)} · {formatGarageKm(log.mileage)}
                      </p>
                      <div className="mt-2 space-y-1 text-sm text-stone-500">
                        {log.shop && <p>정비소 {log.shop}</p>}
                        {log.parts && <p>부품 {log.parts}</p>}
                      </div>
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
                      <div className="mt-2 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => openEdit(log)}
                          className="text-xs font-semibold text-signature-dark hover:underline"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(log)}
                          disabled={deletingId === log.id}
                          className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
                        >
                          {deletingId === log.id ? "삭제 중..." : "삭제"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-stone-800 text-white"
          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
      }`}
    >
      {label}
    </button>
  );
}

function groupLogsByMonth(logs: MaintenanceLog[]) {
  const groups: { label: string; logs: MaintenanceLog[] }[] = [];

  for (const log of logs) {
    const input = toGarageDateInput(log.date);
    const label = /^\d{4}-\d{2}/.test(input)
      ? `${input.slice(0, 4)}년 ${Number(input.slice(5, 7))}월`
      : "날짜 미상";
    const last = groups[groups.length - 1];
    if (last?.label === label) last.logs.push(log);
    else groups.push({ label, logs: [log] });
  }

  return groups;
}

function MaintenanceLogForm({
  defaultMileage,
  initialCategory,
  editingLog,
  onSaved,
  onCancel,
}: {
  defaultMileage: number;
  initialCategory: MaintenanceCategory;
  editingLog: MaintenanceLog | null;
  onSaved: (payload: GarageChangePayload) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(
    editingLog ? toGarageDateInput(editingLog.date) || todayGarageDate() : todayGarageDate()
  );
  const [mileage, setMileage] = useState(
    String(editingLog?.mileage ?? defaultMileage)
  );
  const [category, setCategory] = useState<MaintenanceCategory>(
    editingLog?.category ?? initialCategory
  );
  const [title, setTitle] = useState(
    editingLog?.title ?? maintenanceCategoryLabels[initialCategory]
  );
  const [shop, setShop] = useState(editingLog?.shop ?? "");
  const [cost, setCost] = useState(
    editingLog?.cost != null ? String(editingLog.cost) : ""
  );
  const [parts, setParts] = useState(editingLog?.parts ?? "");
  const [memo, setMemo] = useState(editingLog?.memo ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCategoryChange = (nextCategory: MaintenanceCategory) => {
    setCategory(nextCategory);
    setTitle((current) => {
      const previousLabel = maintenanceCategoryLabels[category];
      if (!current.trim() || current.trim() === previousLabel) {
        return maintenanceCategoryLabels[nextCategory];
      }
      return current;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const endpoint = editingLog
        ? `/api/bike-garage/logs/${editingLog.id}`
        : "/api/bike-garage/logs";
      const response = await fetch(endpoint, {
        method: editingLog ? "PATCH" : "POST",
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
        throw new Error(
          data.error ?? (editingLog ? "수정에 실패했습니다." : "등록에 실패했습니다.")
        );
      }

      onSaved({
        garage: data.garage as UserBikeGarage,
        reminders: data.reminders as MaintenanceReminder[] | undefined,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : editingLog
            ? "수정에 실패했습니다."
            : "등록에 실패했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-signature/10 pt-4">
      <p className="text-xs font-semibold text-stone-500">
        {editingLog ? "정비 기록 수정" : "새 정비 기록"}
      </p>
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
          <span className="text-xs font-semibold text-stone-600">당시 주행거리 (km)</span>
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
              handleCategoryChange(event.target.value as MaintenanceCategory)
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
            placeholder="예: 단골 바이크샵"
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
            placeholder="선택"
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
          placeholder="점착도, 마모 상태, 다음 정비 메모 등"
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
          {submitting
            ? editingLog
              ? "수정 중..."
              : "등록 중..."
            : editingLog
              ? "수정 저장"
              : "기록 저장"}
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
