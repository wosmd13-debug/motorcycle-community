"use client";

import { useEffect, useState } from "react";
import {
  defaultServiceIntervals,
  serviceIntervalActionLabels,
  serviceIntervalKeys,
  serviceIntervalLabels,
  type MaintenanceReminder,
  type UserBikeGarage,
} from "@/lib/bike-garage";

type BikeProfileFormProps = {
  garage: UserBikeGarage;
  onSaved: (payload: {
    garage: UserBikeGarage;
    reminders: MaintenanceReminder[];
  }) => void;
};

export default function BikeProfileForm({ garage, onSaved }: BikeProfileFormProps) {
  const bike = garage.bike;
  const [model, setModel] = useState(bike?.model ?? "");
  const [year, setYear] = useState(bike?.year != null ? String(bike.year) : "");
  const [displacement, setDisplacement] = useState(bike?.displacement ?? "");
  const [currentMileage, setCurrentMileage] = useState(
    bike?.currentMileage != null ? String(bike.currentMileage) : "0"
  );
  const [memo, setMemo] = useState(bike?.memo ?? "");
  const [intervals, setIntervals] = useState(
    bike?.serviceIntervals ?? defaultServiceIntervals
  );
  const [lastServiceAt, setLastServiceAt] = useState<
    Partial<Record<(typeof serviceIntervalKeys)[number], string>>
  >(() => {
    const initial: Partial<Record<(typeof serviceIntervalKeys)[number], string>> =
      {};
    for (const key of serviceIntervalKeys) {
      const value = bike?.lastServiceAt?.[key];
      if (value != null) initial[key] = String(value);
    }
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const nextBike = garage.bike;
    setModel(nextBike?.model ?? "");
    setYear(nextBike?.year != null ? String(nextBike.year) : "");
    setDisplacement(nextBike?.displacement ?? "");
    setCurrentMileage(
      nextBike?.currentMileage != null ? String(nextBike.currentMileage) : "0"
    );
    setMemo(nextBike?.memo ?? "");
    setIntervals(nextBike?.serviceIntervals ?? defaultServiceIntervals);
    const nextLast: Partial<Record<(typeof serviceIntervalKeys)[number], string>> = {};
    for (const key of serviceIntervalKeys) {
      const value = nextBike?.lastServiceAt?.[key];
      if (value != null) nextLast[key] = String(value);
    }
    setLastServiceAt(nextLast);
  }, [garage.updatedAt]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/bike-garage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          year: year || null,
          displacement,
          currentMileage,
          memo,
          serviceIntervals: intervals,
          lastServiceAt: Object.fromEntries(
            serviceIntervalKeys.map((key) => [key, lastServiceAt[key] ?? ""])
          ),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "저장에 실패했습니다.");
      }

      onSaved(data);
      setSuccess("바이크 정보가 저장되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="portal-panel space-y-4 p-4">
      <div>
        <h2 className="text-sm font-bold text-stone-800">내 바이크</h2>
        <p className="mt-1 text-xs text-stone-500">
          현재 주행거리와 교환 주기를 저장하면 소모품 남은 km가 계산됩니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="모델명" required>
          <input
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="예: Honda CB500X"
            className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
            required
          />
        </Field>
        <Field label="배기량">
          <input
            value={displacement}
            onChange={(event) => setDisplacement(event.target.value)}
            placeholder="예: 500cc"
            className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
          />
        </Field>
        <Field label="연식">
          <input
            type="number"
            min={1970}
            max={2100}
            value={year}
            onChange={(event) => setYear(event.target.value)}
            placeholder="예: 2022"
            className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
          />
        </Field>
        <Field label="현재 주행거리 (km)" required>
          <input
            type="number"
            min={0}
            value={currentMileage}
            onChange={(event) => setCurrentMileage(event.target.value)}
            className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
            required
          />
        </Field>
      </div>

      <Field label="메모">
        <textarea
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          rows={2}
          placeholder="튜닝, 타이어 사이즈, 특이사항 등"
          className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
        />
      </Field>

      <div>
        <p className="text-sm font-semibold text-stone-700">소모품 주기 (km)</p>
        <p className="mt-1 text-xs text-stone-500">
          기종 매뉴얼 기준을 그대로 넣으면 됩니다. 체인은 교환이 아니라 점검·윤활 주기입니다.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {serviceIntervalKeys.map((key) => (
            <Field
              key={key}
              label={`${serviceIntervalLabels[key]} ${serviceIntervalActionLabels[key]}`}
            >
              <input
                type="number"
                min={100}
                max={100000}
                value={intervals[key]}
                onChange={(event) =>
                  setIntervals((current) => ({
                    ...current,
                    [key]: Number(event.target.value),
                  }))
                }
                className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
              />
            </Field>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-stone-700">
          앱 사용 전 마지막 정비 km
        </p>
        <p className="mt-1 text-xs text-stone-500">
          일지에 없는 이전 정비만 입력하세요. 이후 정비는 일지에 기록하면 그 km가 우선 적용됩니다. 비우고 저장하면 해당 항목은 초기화됩니다.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {serviceIntervalKeys.map((key) => (
            <Field key={key} label={serviceIntervalLabels[key]}>
              <input
                type="number"
                min={0}
                value={lastServiceAt[key] ?? ""}
                onChange={(event) =>
                  setLastServiceAt((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
                placeholder="비워두면 일지 기준"
                className="w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
              />
            </Field>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}
      {success && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="portal-btn px-4 py-2 text-sm disabled:opacity-60"
      >
        {submitting ? "저장 중..." : "바이크 정보 저장"}
      </button>
    </form>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-stone-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
