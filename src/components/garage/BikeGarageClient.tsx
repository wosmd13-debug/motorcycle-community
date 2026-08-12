"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LoginRequired from "@/components/auth/LoginRequired";
import BikeProfileForm from "@/components/garage/BikeProfileForm";
import MaintenanceLogSection from "@/components/garage/MaintenanceLogSection";
import MaintenanceReminderPanel from "@/components/garage/MaintenanceReminderPanel";
import {
  formatGarageKm,
  intervalKeyToCategory,
  type MaintenanceCategory,
  type MaintenanceReminder,
  type ServiceIntervalKey,
  type UserBikeGarage,
} from "@/lib/bike-garage";

export default function BikeGarageClient() {
  const [garage, setGarage] = useState<UserBikeGarage | null>(null);
  const [reminders, setReminders] = useState<MaintenanceReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [mileageDraft, setMileageDraft] = useState("");
  const [savingMileage, setSavingMileage] = useState(false);
  const [mileageError, setMileageError] = useState<string | null>(null);
  const [draftCategory, setDraftCategory] = useState<MaintenanceCategory | null>(null);
  const [draftNonce, setDraftNonce] = useState(0);

  const loadGarage = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/bike-garage");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "차고 정보를 불러오지 못했습니다.");
      }

      const nextGarage = data.garage as UserBikeGarage;
      setGarage(nextGarage);
      setReminders((data.reminders as MaintenanceReminder[]) ?? []);
      setMileageDraft(
        nextGarage.bike?.currentMileage != null
          ? String(nextGarage.bike.currentMileage)
          : ""
      );
      if (!nextGarage.bike) setShowProfile(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "차고 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGarage();
  }, []);

  const handleGarageUpdate = (payload: {
    garage: UserBikeGarage;
    reminders?: MaintenanceReminder[];
  }) => {
    setGarage(payload.garage);
    if (payload.reminders) {
      setReminders(payload.reminders);
    }
    if (payload.garage.bike?.currentMileage != null) {
      setMileageDraft(String(payload.garage.bike.currentMileage));
    }
  };

  const handleQuickRecord = (key: ServiceIntervalKey) => {
    setDraftCategory(intervalKeyToCategory[key]);
    setDraftNonce(Date.now());
    if (typeof window !== "undefined") {
      document.getElementById("garage-maintenance-log")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleMileageSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!garage?.bike) return;

    const currentMileage = Number(mileageDraft);
    if (!Number.isFinite(currentMileage) || currentMileage < 0) {
      setMileageError("주행거리를 올바르게 입력해 주세요.");
      return;
    }

    setSavingMileage(true);
    setMileageError(null);

    try {
      const response = await fetch("/api/bike-garage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: garage.bike.model,
          year: garage.bike.year ?? null,
          displacement: garage.bike.displacement ?? "",
          currentMileage,
          memo: garage.bike.memo ?? "",
          serviceIntervals: garage.bike.serviceIntervals,
          lastServiceAt: garage.bike.lastServiceAt ?? {},
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "주행거리 저장에 실패했습니다.");
      }
      handleGarageUpdate(data);
    } catch (err) {
      setMileageError(
        err instanceof Error ? err.message : "주행거리 저장에 실패했습니다."
      );
    } finally {
      setSavingMileage(false);
    }
  };

  return (
    <LoginRequired actionLabel="내 차고">
      {loading ? (
        <div className="portal-panel p-6 text-sm text-stone-500">불러오는 중...</div>
      ) : error ? (
        <div className="portal-panel p-6 text-sm text-red-600">{error}</div>
      ) : garage ? (
        <div className="space-y-4">
          <div className="portal-panel p-4">
            <p className="text-sm text-stone-600">
              정비 관련 질문은{" "}
              <Link
                href="/board"
                className="font-semibold text-signature-dark hover:underline"
              >
                게시판 · 정비
              </Link>
              에서 커뮤니티와 나눠 보세요.
            </p>
          </div>

          {garage.bike && (
            <section className="portal-panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-stone-800">
                    {garage.bike.model}
                  </h2>
                  <p className="mt-1 text-sm text-stone-600">
                    {[
                      garage.bike.year ? `${garage.bike.year}년식` : null,
                      garage.bike.displacement,
                      `현재 ${formatGarageKm(garage.bike.currentMileage)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfile((value) => !value)}
                  className="text-xs font-semibold text-signature-dark hover:underline"
                >
                  {showProfile ? "정보 닫기" : "바이크 정보 수정"}
                </button>
              </div>

              <form
                onSubmit={(event) => void handleMileageSave(event)}
                className="mt-4 flex flex-wrap items-end gap-2"
              >
                <label className="min-w-[180px] flex-1">
                  <span className="text-xs font-semibold text-stone-600">
                    현재 주행거리 (km)
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={mileageDraft}
                    onChange={(event) => setMileageDraft(event.target.value)}
                    className="mt-1.5 w-full border border-signature/20 bg-signature-light/40 px-3 py-2.5 text-sm outline-none focus:border-signature focus:ring-2 focus:ring-signature/15"
                  />
                </label>
                <button
                  type="submit"
                  disabled={savingMileage}
                  className="portal-btn px-4 py-2.5 text-sm disabled:opacity-60"
                >
                  {savingMileage ? "반영 중..." : "주행거리 반영"}
                </button>
              </form>
              {mileageError && (
                <p className="mt-2 text-xs text-red-600">{mileageError}</p>
              )}
              <p className="mt-2 text-xs text-stone-500">
                계기판 km만 바꿔도 오일·체인·타이어·브레이크 남은 거리가 다시 계산됩니다.
              </p>
            </section>
          )}

          {(!garage.bike || showProfile) && (
            <BikeProfileForm
              garage={garage}
              onSaved={(payload) => {
                handleGarageUpdate(payload);
                if (payload.garage.bike) setShowProfile(false);
              }}
            />
          )}

          {garage.bike && reminders.length > 0 && (
            <MaintenanceReminderPanel
              reminders={reminders}
              onQuickRecord={handleQuickRecord}
            />
          )}

          <div id="garage-maintenance-log">
            <MaintenanceLogSection
              garage={garage}
              draftCategory={draftCategory}
              draftNonce={draftNonce}
              onChanged={handleGarageUpdate}
            />
          </div>
        </div>
      ) : null}
    </LoginRequired>
  );
}
