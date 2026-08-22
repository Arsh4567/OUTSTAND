import { useCallback, useEffect, useState } from "react";
import { getUsageBridge, readStoredSnapshot, saveSnapshot, type DigitalFrictionSnapshot } from "@/lib/digital-friction";

function todayRange() {
  const end = Date.now();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return { startMs: start.getTime(), endMs: end };
}

export function useDigitalFriction() {
  const [snapshot, setSnapshot] = useState<DigitalFrictionSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const range = todayRange();
    const bridge = getUsageBridge();

    if (bridge) {
      try {
        const next = await bridge.getDailyUsage(range.startMs, range.endMs);
        setSnapshot(next);
        saveSnapshot(next);
        setConnected(true);
        setLoading(false);
        return;
      } catch (error) {
        console.warn("Android usage bridge unavailable:", error);
      }
    }

    setConnected(false);
    setSnapshot(readStoredSnapshot());
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveManual = useCallback((screenMinutes: number, distractionMinutes: number) => {
    const safeScreen = Math.max(0, Math.round(screenMinutes));
    const safeDistraction = Math.max(0, Math.min(safeScreen, Math.round(distractionMinutes)));
    const next: DigitalFrictionSnapshot = {
      source: "manual",
      date: new Date().toISOString().slice(0, 10),
      screenMinutes: safeScreen,
      distractionMinutes: safeDistraction,
      topApp: safeDistraction > 0 ? { appName: "Entertainment apps", minutes: safeDistraction, category: "entertainment" } : undefined,
      apps: [],
      updatedAt: new Date().toISOString(),
    };
    setSnapshot(next);
    saveSnapshot(next);
  }, []);

  return { snapshot, loading, connected, refresh, saveManual };
}
