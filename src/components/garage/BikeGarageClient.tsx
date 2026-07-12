"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LoginRequired from "@/components/auth/LoginRequired";
import BikeProfileForm from "@/components/garage/BikeProfileForm";
import MaintenanceLogSection from "@/components/garage/MaintenanceLogSection";
import MaintenanceReminderPanel from "@/components/garage/MaintenanceReminderPanel";
import {
  type MaintenanceReminder,
  type UserBikeGarage,
} from "@/lib/bike-garage";

export default function BikeGarageClient() {
  const [garage, setGarage] = useState<UserBikeGarage | null>(null);
  const [reminders, setReminders] = useState<MaintenanceReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGarage = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/bike-garage");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "차고 정보를 불러오지 못했습니다.");
      }

      setGarage(data.garage as UserBikeGarage);
      setReminders((data.reminders as MaintenanceReminder[]) ?? []);
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

          <BikeProfileForm garage={garage} onSaved={handleGarageUpdate} />

          {garage.bike && reminders.length > 0 && (
            <MaintenanceReminderPanel reminders={reminders} />
          )}

          <MaintenanceLogSection
            garage={garage}
            onChanged={(nextGarage) => {
              setGarage(nextGarage);
              void loadGarage();
            }}
          />
        </div>
      ) : null}
    </LoginRequired>
  );
}
