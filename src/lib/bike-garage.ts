export const maintenanceCategories = [
  "engine_oil",
  "chain",
  "tire",
  "brake",
  "filter",
  "general",
  "other",
] as const;

export type MaintenanceCategory = (typeof maintenanceCategories)[number];

export const maintenanceCategoryLabels: Record<MaintenanceCategory, string> = {
  engine_oil: "엔진오일",
  chain: "체인",
  tire: "타이어",
  brake: "브레이크",
  filter: "필터",
  general: "종합점검",
  other: "기타",
};

export type ServiceIntervalKey = "oil" | "chain" | "tire" | "brake";

export const serviceIntervalKeys: ServiceIntervalKey[] = [
  "oil",
  "chain",
  "tire",
  "brake",
];

export const serviceIntervalLabels: Record<ServiceIntervalKey, string> = {
  oil: "엔진오일",
  chain: "체인",
  tire: "타이어",
  brake: "브레이크",
};

export const defaultServiceIntervals: Record<ServiceIntervalKey, number> = {
  oil: 3000,
  chain: 500,
  tire: 10000,
  brake: 15000,
};

export type BikeProfile = {
  model: string;
  year?: number;
  displacement?: string;
  currentMileage: number;
  memo?: string;
  serviceIntervals: Record<ServiceIntervalKey, number>;
  lastServiceAt: Partial<Record<ServiceIntervalKey, number>>;
};

export type MaintenanceLog = {
  id: string;
  date: string;
  mileage: number;
  category: MaintenanceCategory;
  title: string;
  shop?: string;
  cost?: number;
  parts?: string;
  memo?: string;
  createdAt: string;
};

export type UserBikeGarage = {
  userId: string;
  bike: BikeProfile | null;
  logs: MaintenanceLog[];
  updatedAt: string;
};

export type MaintenanceReminderStatus = "ok" | "soon" | "due";

export type MaintenanceReminder = {
  key: ServiceIntervalKey;
  label: string;
  intervalKm: number;
  lastServiceKm: number;
  currentMileage: number;
  drivenKm: number;
  remainingKm: number;
  status: MaintenanceReminderStatus;
};

export type CreateMaintenanceLogInput = {
  date: string;
  mileage: number;
  category: MaintenanceCategory;
  title: string;
  shop?: string;
  cost?: number;
  parts?: string;
  memo?: string;
};

export type UpdateMaintenanceLogInput = Partial<CreateMaintenanceLogInput>;

export function createEmptyBikeProfile(): BikeProfile {
  return {
    model: "",
    currentMileage: 0,
    serviceIntervals: { ...defaultServiceIntervals },
    lastServiceAt: {},
  };
}

export function normalizeBikeProfile(bike: BikeProfile): BikeProfile {
  return {
    ...bike,
    model: bike.model.trim(),
    displacement: bike.displacement?.trim() || undefined,
    memo: bike.memo?.trim() || undefined,
    serviceIntervals: {
      oil: bike.serviceIntervals?.oil ?? defaultServiceIntervals.oil,
      chain: bike.serviceIntervals?.chain ?? defaultServiceIntervals.chain,
      tire: bike.serviceIntervals?.tire ?? defaultServiceIntervals.tire,
      brake: bike.serviceIntervals?.brake ?? defaultServiceIntervals.brake,
    },
    lastServiceAt: bike.lastServiceAt ?? {},
  };
}

export function normalizeMaintenanceLog(log: MaintenanceLog): MaintenanceLog {
  return {
    ...log,
    title: log.title.trim(),
    shop: log.shop?.trim() || undefined,
    parts: log.parts?.trim() || undefined,
    memo: log.memo?.trim() || undefined,
  };
}

const categoryToIntervalKey: Partial<
  Record<MaintenanceCategory, ServiceIntervalKey>
> = {
  engine_oil: "oil",
  chain: "chain",
  tire: "tire",
  brake: "brake",
};

export function getIntervalKeyForCategory(
  category: MaintenanceCategory
): ServiceIntervalKey | null {
  return categoryToIntervalKey[category] ?? null;
}

export function applyLogToBikeProfile(
  bike: BikeProfile,
  log: Pick<MaintenanceLog, "category" | "mileage">
): BikeProfile {
  const normalized = normalizeBikeProfile(bike);
  const next: BikeProfile = {
    ...normalized,
    currentMileage: Math.max(normalized.currentMileage, log.mileage),
    lastServiceAt: { ...normalized.lastServiceAt },
  };

  const intervalKey = getIntervalKeyForCategory(log.category);
  if (intervalKey) {
    const previous = next.lastServiceAt[intervalKey] ?? 0;
    if (log.mileage >= previous) {
      next.lastServiceAt[intervalKey] = log.mileage;
    }
  }

  return next;
}

export function getMaintenanceReminders(
  bike: BikeProfile
): MaintenanceReminder[] {
  const normalized = normalizeBikeProfile(bike);

  return serviceIntervalKeys.map((key) => {
    const intervalKm = normalized.serviceIntervals[key];
    const lastServiceKm = normalized.lastServiceAt[key] ?? 0;
    const drivenKm = Math.max(0, normalized.currentMileage - lastServiceKm);
    const remainingKm = intervalKm - drivenKm;

    let status: MaintenanceReminderStatus = "ok";
    if (remainingKm <= 0) {
      status = "due";
    } else if (remainingKm <= Math.max(200, intervalKm * 0.2)) {
      status = "soon";
    }

    return {
      key,
      label: serviceIntervalLabels[key],
      intervalKm,
      lastServiceKm,
      currentMileage: normalized.currentMileage,
      drivenKm,
      remainingKm,
      status,
    };
  });
}

export function formatGarageDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatGarageCost(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value) + "원";
}

export function sortMaintenanceLogs(logs: MaintenanceLog[]): MaintenanceLog[] {
  return [...logs].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function getReminderStatusClass(status: MaintenanceReminderStatus): string {
  switch (status) {
    case "due":
      return "border-red-200 bg-red-50 text-red-800";
    case "soon":
      return "border-amber-200 bg-amber-50 text-amber-900";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
}

export function getReminderStatusLabel(status: MaintenanceReminderStatus): string {
  switch (status) {
    case "due":
      return "교환 필요";
    case "soon":
      return "곧 점검";
    default:
      return "양호";
  }
}
