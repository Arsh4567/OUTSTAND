export type UsageApp = {
  packageName?: string;
  appName: string;
  minutes: number;
  category?: "focus" | "productive" | "social" | "entertainment" | "other";
};

export type DigitalFrictionSnapshot = {
  source: "android" | "manual";
  date: string;
  screenMinutes: number;
  distractionMinutes: number;
  topApp?: UsageApp;
  peakWindow?: string;
  apps: UsageApp[];
  updatedAt: string;
};

export const DIGITAL_FRICTION_KEY = "outstand_digital_friction_v1";

export function formatDuration(minutes: number) {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function frictionLevel(distractionMinutes: number) {
  if (distractionMinutes >= 180) return { label: "High friction", tone: "danger" as const };
  if (distractionMinutes >= 90) return { label: "Moderate friction", tone: "warn" as const };
  return { label: "Low friction", tone: "good" as const };
}

export function computeBrainState(score: number, snapshot: DigitalFrictionSnapshot | null) {
  const digital = snapshot
    ? Math.round(Math.max(0, Math.min(100, 100 - snapshot.distractionMinutes * 0.35)))
    : null;
  const execution = Math.round(Math.max(0, Math.min(100, score + 8)));
  const focus = Math.round(Math.max(0, Math.min(100, score * 0.85 + 15)));
  const recovery = Math.round(Math.max(0, Math.min(100, score * 0.7 + 30)));
  const available = [focus, execution, recovery, digital].filter((value): value is number => value !== null);
  const overall = Math.round(available.reduce((sum, value) => sum + value, 0) / available.length);

  const label = overall >= 85 ? "Peak momentum" : overall >= 70 ? "High momentum" : overall >= 50 ? "Building momentum" : "Reset needed";
  return { overall, label, focus, digital, execution, recovery };
}

export function readStoredSnapshot(date = new Date().toISOString().slice(0, 10)): DigitalFrictionSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${DIGITAL_FRICTION_KEY}_${date}`);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as DigitalFrictionSnapshot;
    return snapshot.source === "android" ? snapshot : null;
  } catch {
    return null;
  }
}

export function saveSnapshot(snapshot: DigitalFrictionSnapshot) {
  if (typeof window === "undefined" || snapshot.source !== "android") return;
  window.localStorage.setItem(`${DIGITAL_FRICTION_KEY}_${snapshot.date}`, JSON.stringify(snapshot));
}

export function getUsageBridge() {
  if (typeof window === "undefined") return null;
  return window.OutstandAndroidUsage ?? null;
}

export async function openUsageAccessSettings() {
  const bridge = getUsageBridge();
  if (!bridge?.openUsageAccessSettings) {
    throw new Error("Usage access requires the Android version of OUTSTAND on this device.");
  }
  await bridge.openUsageAccessSettings();
}

declare global {
  interface Window {
    OutstandAndroidUsage?: {
      getDailyUsage: (startMs: number, endMs: number) => Promise<DigitalFrictionSnapshot>;
      openUsageAccessSettings?: () => Promise<void> | void;
      hasUsageAccess?: () => Promise<boolean> | boolean;
    };
  }
}
