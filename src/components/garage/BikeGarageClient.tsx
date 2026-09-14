"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import LoginRequired from "@/components/auth/LoginRequired";
import BikeProfileForm from "@/components/garage/BikeProfileForm";
import MaintenanceLogSection from "@/components/garage/MaintenanceLogSection";
import MaintenanceReminderPanel from "@/components/garage/MaintenanceReminderPanel";
import {
  formatGarageKm,
  intervalKeyToCategory,
  MAX_BIKES_PER_USER,
  type MaintenanceCategory,
  type ServiceIntervalKey,
  type UserBikeGarageWithReminders,
} from "@/lib/bike-garage";

export default function BikeGarageClient() {
  const [garage, setGarage] = useState<UserBikeGarageWithReminders | null>(null);
  const [activeBikeId, setActiveBikeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mileageDraft, setMileageDraft] = useState("");
  const [savingMileage, setSavingMileage] = useState(false);
  const [mileageError, setMileageError] = useState<string | null>(null);
  const [draftCategory, setDraftCategory] = useState<MaintenanceCategory | null>(null);
  const [draftNonce, setDraftNonce] = useState(0);

  const activeBike = useMemo(
    () => garage?.bikes.find((entry) => entry.id === activeBikeId) ?? null,
    [garage, activeBikeId]
  );

  const focusBike = (nextGarage: UserBikeGarageWithReminders, bikeId: string | null) => {
    setActiveBikeId(bikeId);
    const bike = bikeId ? nextGarage.bikes.find((entry) => entry.id === bikeId) : null;
    setMileageDraft(
      bike?.profile.currentMileage != null ? String(bike.profile.currentMileage) : ""
    );
  };

  const loadGarage = async (preferredBikeId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/bike-garage");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "차고 정보를 불러오지 못했습니다.");
      }

      const nextGarage = data.garage as UserBikeGarageWithReminders;
      setGarage(nextGarage);

      const nextActiveId =
        (preferredBikeId &&
          nextGarage.bikes.some((entry) => entry.id === preferredBikeId) &&
          preferredBikeId) ||
        nextGarage.bikes[0]?.id ||
        null;
      focusBike(nextGarage, nextActiveId);
      setAddingNew(nextGarage.bikes.length === 0);
      setShowProfile(nextGarage.bikes.length === 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "차고 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGarage();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  const handleGarageUpdate = (payload: {
    garage: UserBikeGarageWithReminders;
    focusBikeId?: string;
  }) => {
    setGarage(payload.garage);
    const nextActiveId =
      (payload.focusBikeId &&
        payload.garage.bikes.some((entry) => entry.id === payload.focusBikeId) &&
        payload.focusBikeId) ||
      (activeBikeId &&
        payload.garage.bikes.some((entry) => entry.id === activeBikeId) &&
        activeBikeId) ||
      payload.garage.bikes[0]?.id ||
      null;
    focusBike(payload.garage, nextActiveId);
    setShowProfile(false);
    setAddingNew(false);
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
    if (!activeBike) return;

    const currentMileage = Number(mileageDraft);
    if (!Number.isFinite(currentMileage) || currentMileage < 0) {
      setMileageError("주행거리를 올바르게 입력해 주세요.");
      return;
    }

    setSavingMileage(true);
    setMileageError(null);

    try {
      const response = await fetch(`/api/bike-garage/bikes/${activeBike.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: activeBike.profile.model,
          year: activeBike.profile.year ?? null,
          displacement: activeBike.profile.displacement ?? "",
          currentMileage,
          memo: activeBike.profile.memo ?? "",
          serviceIntervals: activeBike.profile.serviceIntervals,
          lastServiceAt: activeBike.profile.lastServiceAt ?? {},
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "주행거리 저장에 실패했습니다.");
      }
      handleGarageUpdate({ garage: data.garage, focusBikeId: activeBike.id });
    } catch (err) {
      setMileageError(
        err instanceof Error ? err.message : "주행거리 저장에 실패했습니다."
      );
    } finally {
      setSavingMileage(false);
    }
  };

  const handleDeleteBike = async () => {
    if (!activeBike) return;
    if (
      !window.confirm(
        `"${activeBike.profile.model}" 바이크와 정비 기록을 모두 삭제할까요? 되돌릴 수 없습니다.`
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/bike-garage/bikes/${activeBike.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "바이크 삭제에 실패했습니다.");
      }
      handleGarageUpdate({ garage: data.garage });
    } catch (err) {
      setError(err instanceof Error ? err.message : "바이크 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const bikes = garage?.bikes ?? [];
  const canAddMore = bikes.length < MAX_BIKES_PER_USER;

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

          {bikes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {bikes.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    focusBike(garage, entry.id);
                    setAddingNew(false);
                    setShowProfile(false);
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    activeBikeId === entry.id && !addingNew
                      ? "bg-stone-800 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {entry.profile.model || "이름 없는 바이크"}
                </button>
              ))}
              {canAddMore ? (
                <button
                  type="button"
                  onClick={() => {
                    setAddingNew(true);
                    setShowProfile(true);
                  }}
                  className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                    addingNew
                      ? "border-signature bg-signature-light text-signature-dark"
                      : "border-dashed border-signature/40 text-signature-dark hover:bg-signature-light"
                  }`}
                >
                  + 바이크 추가
                </button>
              ) : (
                <span className="self-center text-xs text-stone-400">
                  최대 {MAX_BIKES_PER_USER}대까지 등록할 수 있어요
                </span>
              )}
            </div>
          )}

          {activeBike && !addingNew && (
            <section className="portal-panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-stone-800">
                    {activeBike.profile.model}
                  </h2>
                  <p className="mt-1 text-sm text-stone-600">
                    {[
                      activeBike.profile.year
                        ? `${activeBike.profile.year}년식`
                        : null,
                      activeBike.profile.displacement,
                      `현재 ${formatGarageKm(activeBike.profile.currentMileage)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setShowProfile((value) => !value)}
                    className="text-xs font-semibold text-signature-dark hover:underline"
                  >
                    {showProfile ? "정보 닫기" : "바이크 정보 수정"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteBike()}
                    disabled={deleting}
                    className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
                  >
                    {deleting ? "삭제 중..." : "바이크 삭제"}
                  </button>
                </div>
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
                계기판 km만 바꿔도 오일·체인·타이어·브레이크 남은 거리가 다시 계산됩니다. 라이딩
                코스 상세 화면의 &quot;이 코스 탔어요&quot; 버튼으로도 반영할 수 있어요.
              </p>
            </section>
          )}

          {(addingNew || (activeBike && showProfile)) && (
            <BikeProfileForm
              key={addingNew ? "new" : activeBike?.id}
              bike={addingNew ? null : (activeBike ?? null)}
              onSaved={(payload) => handleGarageUpdate(payload)}
              onCancel={
                bikes.length > 0
                  ? () => {
                      setAddingNew(false);
                      setShowProfile(false);
                    }
                  : undefined
              }
            />
          )}

          {activeBike && !addingNew && activeBike.reminders.length > 0 && (
            <MaintenanceReminderPanel
              reminders={activeBike.reminders}
              onQuickRecord={handleQuickRecord}
            />
          )}

          {activeBike && !addingNew && (
            <div id="garage-maintenance-log">
              <MaintenanceLogSection
                bikeId={activeBike.id}
                logs={activeBike.logs}
                currentMileage={activeBike.profile.currentMileage}
                draftCategory={draftCategory}
                draftNonce={draftNonce}
                onChanged={handleGarageUpdate}
              />
            </div>
          )}
        </div>
      ) : null}
    </LoginRequired>
  );
}
