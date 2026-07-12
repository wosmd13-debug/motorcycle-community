"use client";

import WeeklyHoursEditor from "@/components/cafes/WeeklyHoursEditor";
import { emptyWeeklyOpenHours, type WeeklyOpenHours } from "@/lib/rider-cafe-hours";
import { isPromoBusinessCategory, type PromoCategory } from "@/lib/promo";

export type PromoBusinessFormValues = {
  address: string;
  phone: string;
  businessWeeklyHours: WeeklyOpenHours;
  businessStatus: string;
};

export const emptyPromoBusinessValues = (): PromoBusinessFormValues => ({
  address: "",
  phone: "",
  businessWeeklyHours: emptyWeeklyOpenHours(),
  businessStatus: "",
});

type PromoBusinessFieldsProps = {
  category: PromoCategory;
  values: PromoBusinessFormValues;
  legacyBusinessHours?: string;
  onChange: <K extends keyof PromoBusinessFormValues>(
    key: K,
    value: PromoBusinessFormValues[K]
  ) => void;
};

export default function PromoBusinessFields({
  category,
  values,
  legacyBusinessHours,
  onChange,
}: PromoBusinessFieldsProps) {
  if (!isPromoBusinessCategory(category)) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-signature/20 bg-signature-light/30 p-4">
      <div>
        <p className="text-sm font-bold text-stone-800">업체 정보</p>
        <p className="mt-1 text-xs text-stone-500">
          방문에 필요한 주소, 연락처, 요일별 영업시간, 영업 현황을 입력할 수 있습니다.
        </p>
      </div>

      <Field
        label="주소 (선택)"
        value={values.address}
        onChange={(value) => onChange("address", value)}
        placeholder="예: 경기 남양주시 팔당면 팔당로 88"
      />
      <Field
        label="전화번호 (선택)"
        value={values.phone}
        onChange={(value) => onChange("phone", value)}
        placeholder="예: 031-123-4567"
        type="tel"
      />

      <WeeklyHoursEditor
        value={values.businessWeeklyHours}
        onChange={(hours) => onChange("businessWeeklyHours", hours)}
      />

      {legacyBusinessHours && (
        <p className="rounded-xl bg-white/80 px-3 py-2 text-xs text-stone-500">
          기존 영업시간 메모: {legacyBusinessHours}
        </p>
      )}

      <Field
        label="영업 현황 (선택)"
        value={values.businessStatus}
        onChange={(value) => onChange("businessStatus", value)}
        placeholder="예: 영업중 / 일요일 정기 휴무 / 22:00 마감"
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-stone-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full border border-signature/20 bg-white px-4 py-3 text-sm outline-none focus:border-signature"
      />
    </label>
  );
}
