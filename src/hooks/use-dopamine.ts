import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { computeScore, type PositiveKey, type NegativeKey } from "@/lib/dopamine";
import { todayISO, lastNDays } from "@/lib/habits";

export type DailyLog = {
  log_date: string;
  positives: PositiveKey[];
  negatives: NegativeKey[];
  score: number;
};

// Key for Local Storage backup
const getStorageKey = (date: string) => `dopamine_log_${date}`;

export function useDailyLog(dateISO: string = todayISO()) {
  const { user } = useAuth();
    const [log, setLog] = useState<DailyLog | null>(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(dateISO));
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse local storage, clearing cache:", e);
      localStorage.removeItem(getStorageKey(dateISO)); // Clear corrupted data
      return null;
    }
  });
  
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("daily_logs")
      .select("log_date, positives, negatives, score")
      .eq("user_id", user.id)
      .eq("log_date", dateISO)
      .maybeSingle();

    const fetchedLog: DailyLog = data
      ? {
          log_date: data.log_date,
          positives: (data.positives as PositiveKey[]) ?? [],
          negatives: (data.negatives as NegativeKey[]) ?? [],
          score: data.score,
        }
      : { log_date: dateISO, positives: [], negatives: [], score: 50 };

    setLog(fetchedLog);
    // Sync backup with server result
    localStorage.setItem(getStorageKey(dateISO), JSON.stringify(fetchedLog));
    setLoading(false);
  }, [user, dateISO]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const upsert = useCallback(
    async (positives: PositiveKey[], negatives: NegativeKey[]) => {
      if (!user) return;
      const score = computeScore(positives, negatives);
      const optimistic: DailyLog = { log_date: dateISO, positives, negatives, score };
      
      // 1. Optimistic Update (UI updates instantly)
      setLog(optimistic);
      
      // 2. Local Backup (Offline readiness)
      localStorage.setItem(getStorageKey(dateISO), JSON.stringify(optimistic));

      // 3. Background Sync (Server update)
      const { error } = await supabase
        .from("daily_logs")
        .upsert({ user_id: user.id, log_date: dateISO, positives, negatives, score }, { onConflict: "user_id,log_date" });
      
      if (error) {
        console.error("Sync failed, but backup is saved:", error);
      }
    },
    [user, dateISO],
  );

  // Toggle/Add functions use the same upsert flow
  const togglePositive = useCallback(async (key: PositiveKey) => {
    const positives = log?.positives ?? [];
    const negatives = log?.negatives ?? [];
    const next = positives.includes(key) ? positives.filter((k) => k !== key) : [...positives, key];
    await upsert(next, negatives);
  }, [log, upsert]);

  const toggleNegative = useCallback(async (key: NegativeKey) => {
    const positives = log?.positives ?? [];
    const negatives = log?.negatives ?? [];
    const next = negatives.includes(key) ? negatives.filter((k) => k !== key) : [...negatives, key];
    await upsert(positives, next);
  }, [log, upsert]);

  const addPositive = useCallback(async (key: PositiveKey) => {
    if (log?.positives.includes(key)) return;
    await upsert([...(log?.positives ?? []), key], log?.negatives ?? []);
  }, [log, upsert]);

  const addNegative = useCallback(async (key: NegativeKey) => {
    if (log?.negatives.includes(key)) return;
    await upsert(log?.positives ?? [], [...(log?.negatives ?? []), key]);
  }, [log, upsert]);

  return { log, loading, togglePositive, toggleNegative, addPositive, addNegative, refetch };
}

// Keep useWeeklyLogs as is, or apply similar storage logic if needed
export function useWeeklyLogs(days = 7) {
  // ... (Existing logic for weekly view)
                                     }
