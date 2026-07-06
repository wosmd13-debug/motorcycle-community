"use client";

import WeeklyHoursEditor from "@/components/cafes/WeeklyHoursEditor";
import {
  emptyWeeklyOpenHours,
  migrateLegacyOpenHours,
  type WeeklyOpenHours,
} from "@/lib/rider-cafe-hours";
import { riderCafeCategories, type RiderCafeRegion } from "@/lib/rider-cafe";

export type RiderCafeFormValues = {
  name: string;
  author: string;
  address: string;
  region: RiderCafeRegion;
  description: string;
  amenities: string;
  phone: string;
  weeklyHours: WeeklyOpenHours;
  closedDays: string;
  directions: string;
  website: string;
};

export function emptyRiderCafeFormValues(
  region: RiderCafeRegion = "수도권"
): RiderCafeFormValues {
  return {
    name: "",
    author: "",
    address: "",
    region,
    description: "",
    amenities: "",
    phone: "",
    weeklyHours: emptyWeeklyOpenHours(),
    closedDays: "",
    directions: "",
    website: "",
  };
}

type FieldProps = {
  values: RiderCafeFormValues;
  onChange: <K extends keyof RiderCafeFormValues>(
    key: K,
    value: RiderCafeFormValues[K]
  ) => void;
};

export function RiderCafeBasicFields({ values, onChange }: FieldProps) {
  return (
    <>
      <Input
        label="카페 이름"
        value={values.name}
        onChange={(value) => onChange("name", value)}
        required
      />
      <Input
        label="등록자"
        value={values.author}
        onChange={(value) => onChange("author", value)}
        required
      />
      <Input
        label="주소"
        value={values.address}
        onChange={(value) => onChange("address", value)}
        required
        placeholder="예: 경기 가평군 청평면 청평호수로 12"
      />

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">지역 카테고리</span>
        <select
          value={values.region}
          onChange={(event) =>
            onChange("region", event.target.value as RiderCafeRegion)
          }
          className="mt-2 w-full rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm outline-none focus:border-orange-300"
        >
          {riderCafeCategories
            .filter((item) => item !== "전체")
            .map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">소개 (선택)</span>
        <textarea
          value={values.description}
          onChange={(event) => onChange("description", event.target.value)}
          rows={3}
          className="mt-2 w-full rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm outline-none focus:border-orange-300"
          placeholder="카페 분위기, 추천 메뉴, 라이더에게 좋은 점 등"
        />
      </label>

      <Input
        label="편의시설 (선택)"
        value={values.amenities}
        onChange={(value) => onChange("amenities", value)}
        placeholder="바이크 주차, Wi-Fi, 테라스 (쉼표로 구분)"
      />
    </>
  );
}

export function RiderCafeBusinessFields({ values, onChange }: FieldProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
      <div>
        <p className="text-sm font-bold text-slate-800">업체 정보</p>
        <p className="mt-1 text-xs text-slate-500">
          전화번호, 요일별 영업시간, 오는 길 등 방문에 필요한 정보를 입력해 주세요.
        </p>
      </div>

      <Input
        label="전화번호 (선택)"
        value={values.phone}
        onChange={(value) => onChange("phone", value)}
        placeholder="예: 031-123-4567"
        type="tel"
      />

      <WeeklyHoursEditor
        value={values.weeklyHours}
        onChange={(hours) => onChange("weeklyHours", hours)}
      />

      <Input
        label="임시 휴무 / 공휴일 안내 (선택)"
        value={values.closedDays}
        onChange={(value) => onChange("closedDays", value)}
        placeholder="예: 설·추석 당일, 폭우 시 임시 휴무"
      />

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">오는 길 (선택)</span>
        <textarea
          value={values.directions}
          onChange={(event) => onChange("directions", event.target.value)}
          rows={4}
          className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300"
          placeholder="IC, 랜드마크, 바이크 주차 위치 등 상세 안내"
        />
      </label>

      <Input
        label="웹사이트 / SNS (선택)"
        value={values.website}
        onChange={(value) => onChange("website", value)}
        placeholder="예: https://instagram.com/..."
        type="url"
      />
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required = false,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm outline-none focus:border-orange-300"
      />
    </label>
  );
}

export function formValuesToPayload(values: RiderCafeFormValues) {
  return {
    name: values.name,
    author: values.author,
    address: values.address,
    region: values.region,
    description: values.description,
    amenities: values.amenities,
    phone: values.phone,
    weeklyHours: values.weeklyHours,
    closedDays: values.closedDays,
    directions: values.directions,
    website: values.website,
  };
}

export function entryToFormValues(entry: {
  name: string;
  author: string;
  address: string;
  region: RiderCafeRegion;
  description?: string;
  amenities?: string[];
  phone?: string;
  weeklyHours?: WeeklyOpenHours;
  openHours?: string;
  closedDays?: string;
  directions?: string;
  website?: string;
}): RiderCafeFormValues {
  const weeklyHours =
    entry.weeklyHours ??
    migrateLegacyOpenHours(entry.openHours, entry.closedDays) ??
    emptyWeeklyOpenHours();

  return {
    name: entry.name,
    author: entry.author,
    address: entry.address,
    region: entry.region,
    description: entry.description ?? "",
    amenities: entry.amenities?.join(", ") ?? "",
    phone: entry.phone ?? "",
    weeklyHours,
    closedDays: entry.closedDays ?? "",
    directions: entry.directions ?? "",
    website: entry.website ?? "",
  };
}
