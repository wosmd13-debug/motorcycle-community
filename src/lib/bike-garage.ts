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

export const serviceIntervalActionLabels: Record<ServiceIntervalKey, string> = {
  oil: "교환",
  chain: "점검",
  tire: "교환",
  brake: "교환",
};

export const intervalKeyToCategory: Record<ServiceIntervalKey, MaintenanceCategory> = {
  oil: "engine_oil",
  chain: "chain",
  tire: "tire",
  brake: "brake",
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

export type MaintenanceReminderStatus = "ok" | "soon" | "due" | "unknown";

export type MaintenanceReminderSource = "log" | "manual" | "none";

export type MaintenanceReminder = {
  key: ServiceIntervalKey;
  label: string;
  actionLabel: string;
  intervalKm: number;
  lastServiceKm: number | null;
  lastServiceDate: string | null;
  currentMileage: number;
  drivenKm: number;
  remainingKm: number | null;
  nextServiceKm: number | null;
  status: MaintenanceReminderStatus;
  source: MaintenanceReminderSource;
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

export function getLatestLogForInterval(
  logs: MaintenanceLog[],
  key: ServiceIntervalKey
): MaintenanceLog | null {
  let latest: MaintenanceLog | null = null;

  for (const log of logs) {
    if (getIntervalKeyForCategory(log.category) !== key) continue;
    if (!latest || log.mileage > latest.mileage) {
      latest = log;
      continue;
    }
    if (log.mileage === latest.mileage) {
      const logTime = new Date(log.date).getTime();
      const latestTime = new Date(latest.date).getTime();
      if (logTime > latestTime) latest = log;
    }
  }

  return latest;
}

export function maxLogMileage(logs: MaintenanceLog[]): number {
  return logs.reduce((max, log) => Math.max(max, log.mileage), 0);
}

export function syncBikeMileageFromLogs(
  bike: BikeProfile,
  logs: MaintenanceLog[]
): BikeProfile {
  const normalized = normalizeBikeProfile(bike);
  return {
    ...normalized,
    currentMileage: Math.max(normalized.currentMileage, maxLogMileage(logs)),
  };
}

/**
 * 일지로 자동 채워졌던 lastServiceAt을 로그 변경 후 다시 맞춘다.
 * 사용자가 직접 입력한 값이 최신 일지 km와 다를 때는 그대로 둔다.
 */
export function reconcileLastServiceAfterLogsChange(
  bike: BikeProfile,
  previousLogs: MaintenanceLog[],
  nextLogs: MaintenanceLog[]
): BikeProfile {
  const next: BikeProfile = {
    ...normalizeBikeProfile(bike),
    lastServiceAt: { ...bike.lastServiceAt },
  };

  for (const key of serviceIntervalKeys) {
    const previousLatest = getLatestLogForInterval(previousLogs, key);
    const nextLatest = getLatestLogForInterval(nextLogs, key);
    const manualKm = next.lastServiceAt[key];

    if (previousLatest && manualKm === previousLatest.mileage) {
      if (nextLatest) {
        next.lastServiceAt[key] = nextLatest.mileage;
      } else {
        delete next.lastServiceAt[key];
      }
    }
  }

  return syncBikeMileageFromLogs(next, nextLogs);
}

export function applyLogToBikeProfile(
  bike: BikeProfile,
  log: Pick<MaintenanceLog, "category" | "mileage">
): BikeProfile {
  const normalized = normalizeBikeProfile(bike);
  return {
    ...normalized,
    currentMileage: Math.max(normalized.currentMileage, log.mileage),
  };
}

export function getMaintenanceReminders(
  bike: BikeProfile,
  logs: MaintenanceLog[] = []
): MaintenanceReminder[] {
  const normalized = syncBikeMileageFromLogs(bike, logs);

  return serviceIntervalKeys.map((key) => {
    const intervalKm = Math.max(1, Math.floor(normalized.serviceIntervals[key]));
    const latestLog = getLatestLogForInterval(logs, key);
    const manualKm =
      normalized.lastServiceAt[key] != null
        ? Math.floor(normalized.lastServiceAt[key] as number)
        : null;
    const logKm = latestLog != null ? Math.floor(latestLog.mileage) : null;

    let lastServiceKm: number | null = null;
    let source: MaintenanceReminderSource = "none";
    let lastServiceDate: string | null = null;

    if (logKm != null && (manualKm == null || logKm >= manualKm)) {
      lastServiceKm = logKm;
      source = "log";
      lastServiceDate = latestLog?.date ?? null;
    } else if (manualKm != null) {
      lastServiceKm = manualKm;
      source = "manual";
    }

    const currentMileage = Math.floor(normalized.currentMileage);

    if (lastServiceKm == null) {
      return {
        key,
        label: serviceIntervalLabels[key],
        actionLabel: serviceIntervalActionLabels[key],
        intervalKm,
        lastServiceKm: null,
        lastServiceDate: null,
        currentMileage,
        drivenKm: 0,
        remainingKm: null,
        nextServiceKm: null,
        status: "unknown" as const,
        source,
      };
    }

    const drivenKm = Math.max(0, currentMileage - lastServiceKm);
    const remainingKm = intervalKm - drivenKm;
    const nextServiceKm = lastServiceKm + intervalKm;
    const soonThreshold = Math.max(1, Math.round(intervalKm * 0.2));

    let status: MaintenanceReminderStatus = "ok";
    if (remainingKm <= 0) {
      status = "due";
    } else if (remainingKm <= soonThreshold) {
      status = "soon";
    }

    return {
      key,
      label: serviceIntervalLabels[key],
      actionLabel: serviceIntervalActionLabels[key],
      intervalKm,
      lastServiceKm,
      lastServiceDate,
      currentMileage,
      drivenKm,
      remainingKm,
      nextServiceKm,
      status,
      source,
    };
  });
}

export function toGarageDateInput(value: string): string {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayGarageDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatGarageDate(value: string): string {
  const input = toGarageDateInput(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return value;
  const [year, month, day] = input.split("-");
  return `${year}. ${month}. ${day}.`;
}

export function formatGarageKm(value: number): string {
  return `${Math.round(value).toLocaleString("ko-KR")}km`;
}

export function formatGarageCost(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value) + "원";
}

export function getReminderProgressPercent(reminder: MaintenanceReminder): number {
  if (reminder.status === "unknown" || reminder.intervalKm <= 0) return 0;
  return Math.min(100, Math.round((reminder.drivenKm / reminder.intervalKm) * 100));
}

export function maintenanceCategoryBadgeClass(
  category: MaintenanceCategory
): string {
  switch (category) {
    case "engine_oil":
      return "bg-amber-100 text-amber-900";
    case "chain":
      return "bg-slate-200 text-slate-800";
    case "tire":
      return "bg-sky-100 text-sky-800";
    case "brake":
      return "bg-rose-100 text-rose-800";
    case "filter":
      return "bg-violet-100 text-violet-800";
    case "general":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-stone-200 text-stone-700";
  }
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
    case "unknown":
      return "border-stone-200 bg-stone-50 text-stone-700";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
}

export function getReminderStatusLabel(
  status: MaintenanceReminderStatus,
  actionLabel = "교환"
): string {
  switch (status) {
    case "due":
      return `${actionLabel} 필요`;
    case "soon":
      return `곧 ${actionLabel}`;
    case "unknown":
      return "기록 없음";
    default:
      return "양호";
  }
}
