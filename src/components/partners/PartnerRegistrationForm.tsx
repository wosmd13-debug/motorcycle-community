"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import PlaceCard from "@/components/places/PlaceCard";
import type { BariRoute } from "@/lib/routes-data";
import { isAllowedNaverBookingUrl } from "@/lib/naver-booking";
import {
  emptyRegistrationRequest,
  getPartnerPlaces,
  partnerPlans,
  placeCategoryLabels,
  type PlaceCategory,
  type PlaceRegistrationRequest,
} from "@/lib/places-data";

export default function PartnerRegistrationForm({
  bariRoutes = [],
}: {
  bariRoutes?: BariRoute[];
}) {
  const [form, setForm] = useState<PlaceRegistrationRequest>(
    emptyRegistrationRequest
  );
  const [submitted, setSubmitted] = useState(false);

  function updateField<K extends keyof PlaceRegistrationRequest>(
    key: K,
    value: PlaceRegistrationRequest[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleRoute(routeId: number) {
    setForm((prev) => ({
      ...prev,
      routeIds: prev.routeIds.includes(routeId)
        ? prev.routeIds.filter((id) => id !== routeId)
        : [...prev.routeIds, routeId],
    }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (
      form.category === "accommodation" &&
      form.naverBookingUrl &&
      !isAllowedNaverBookingUrl(form.naverBookingUrl)
    ) {
      alert("네이버 예약 URL 형식을 확인해 주세요. (hotels.naver.com, map.naver.com, pcmap.place.naver.com 등)");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-10 text-center">
        <h3 className="text-xl font-bold text-slate-800">
          입점 신청이 접수되었습니다
        </h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          현재는 데모 단계입니다. 추후 관리자 승인·결제 연동 후 실제 등록이
          진행됩니다.
          <br />
          <strong>{form.businessName}</strong> · {form.ownerName}님
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setForm(emptyRegistrationRequest);
          }}
          className="mt-6 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          새 신청 작성
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-3xl border border-signature/20 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800">1. 홍보 플랜 선택</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {partnerPlans.map((plan) => (
            <label
              key={plan.id}
              className={`cursor-pointer rounded-2xl border p-5 transition ${
                form.planId === plan.id
                  ? "border-signature bg-signature-light ring-2 ring-signature/30"
                  : "border-slate-100 hover:border-signature/30"
              }`}
            >
              <input
                type="radio"
                name="plan"
                value={plan.id}
                checked={form.planId === plan.id}
                onChange={() => updateField("planId", plan.id)}
                className="sr-only"
              />
              <p className="font-bold text-slate-800">{plan.name}</p>
              <p className="mt-1 text-sm font-semibold text-signature-dark">
                {plan.price}
              </p>
              <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-signature/20 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800">2. 매장 정보</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="매장명">
            <input
              required
              value={form.businessName}
              onChange={(e) => updateField("businessName", e.target.value)}
              className={inputClass}
              placeholder="예: 바람카페 남해"
            />
          </Field>
          <Field label="대표자명">
            <input
              required
              value={form.ownerName}
              onChange={(e) => updateField("ownerName", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="이메일">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="연락처">
            <input
              required
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="업종">
            <select
              value={form.category}
              onChange={(e) =>
                updateField("category", e.target.value as PlaceCategory)
              }
              className={inputClass}
            >
              {Object.entries(placeCategoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="주소">
            <input
              required
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="매장 소개" className="mt-4">
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            className={inputClass}
            placeholder="라이더에게 appealing한 매장 특징을 적어주세요."
          />
        </Field>
        <Field label="라이더 혜택 (선택)" className="mt-4">
          <input
            value={form.promotionHeadline}
            onChange={(e) => updateField("promotionHeadline", e.target.value)}
            className={inputClass}
            placeholder="예: 헬멧 착용 시 음료 10% 할인"
          />
        </Field>
        {form.category === "accommodation" ? (
          <Field label="네이버 예약 URL" className="mt-4">
            <input
              required
              type="url"
              value={form.naverBookingUrl ?? ""}
              onChange={(e) => updateField("naverBookingUrl", e.target.value)}
              className={inputClass}
              placeholder="https://hotels.naver.com/... 또는 https://map.naver.com/..."
            />
            <p className="mt-2 text-xs text-slate-500">
              네이버 호텔·플레이스 예약 페이지 URL을 입력하세요. 코스 상세에서
              &quot;네이버 예약&quot; 버튼으로 연결됩니다.
            </p>
          </Field>
        ) : null}
      </section>

      <section className="rounded-3xl border border-signature/20 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800">
          3. 연결할 바리 코스 (복수 선택)
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          선택한 코스 상세 페이지와 지도에 매장이 표시됩니다.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {bariRoutes.map((route) => (
            <label
              key={route.id}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 ${
                form.routeIds.includes(route.id)
                  ? "border-signature/40 bg-signature-light"
                  : "border-slate-100"
              }`}
            >
              <input
                type="checkbox"
                checked={form.routeIds.includes(route.id)}
                onChange={() => toggleRoute(route.id)}
                className="mt-1"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {route.name}
                </p>
                <p className="text-xs text-slate-500">
                  {route.region} · {route.distance}
                </p>
              </div>
            </label>
          ))}
        </div>
      </section>

      <button
        type="submit"
        className="w-full rounded-full bg-signature-dark py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-signature-darker"
      >
        입점·홍보 신청하기 (데모)
      </button>
      <p className="text-center text-xs text-slate-400">
        추후 사장님 대시보드, 결제, 승인 절차가 연결됩니다.
      </p>
    </form>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-signature/20 bg-signature-light/40 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-signature focus:bg-white";

export function PartnerPlanCards() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {partnerPlans.map((plan) => (
        <div
          key={plan.id}
          className={`rounded-3xl border p-6 ${
            plan.highlighted
              ? "border-amber-300 bg-gradient-to-br from-signature-light to-signature-muted shadow-md"
              : "border-signature/20 bg-white shadow-sm"
          }`}
        >
          {plan.highlighted && (
            <span className="rounded-full bg-signature-dark px-3 py-1 text-xs font-bold text-white">
              추천
            </span>
          )}
          <h3 className="mt-2 text-xl font-bold text-slate-800">{plan.name}</h3>
          <p className="mt-1 text-lg font-semibold text-signature-dark">
            {plan.price}
          </p>
          <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
          <ul className="mt-4 space-y-2">
            {plan.features.map((feature) => (
              <li key={feature} className="flex gap-2 text-sm text-slate-600">
                <span className="text-emerald-500">-</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function PartnerPlacePreview() {
  const partners = getPartnerPlaces().slice(0, 3);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {partners.map((place) => (
        <PlaceCard key={place.id} place={place} compact />
      ))}
    </div>
  );
}
