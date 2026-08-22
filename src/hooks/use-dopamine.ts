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
  recorded: boolean;
};

const getStorageKey = (date: string) => `dopamine_log_${date}`;

function readStoredLog(dateISO: string): DailyLog | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(getStorageKey(dateISO));
    if (!saved) return null;
    const parsed = JSON.parse(saved) as Partial<DailyLog>;
    if (!parsed || typeof parsed !== "object") return null;

    return {
      log_date: typeof parsed.log_date === "string" ? parsed.log_date : dateISO,
      positives: Array.isArray(parsed.positives) ? (parsed.positives as PositiveKey[]) : [],
      negatives: Array.isArray(parsed.negatives) ? (parsed.negatives as NegativeKey[]) : [],
      score: typeof parsed.score === "number" ? parsed.score : 50,
      recorded: parsed.recorded !== false,
    };
  } catch {
    return null;
  }
}

export function useDailyLog(dateISO: string = todayISO()) {
  const { user } = useAuth();
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLog(readStoredLog(dateISO));
  }, [dateISO]);

  const refetch = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("log_date, positives, negatives, score")
        .eq("user_id", user.id)
        .eq("log_date", dateISO)
        .maybeSingle();

      if (error) throw error;

      const fetchedLog: DailyLog = {
        log_date: data?.log_date ?? dateISO,
        positives: Array.isArray(data?.positives) ? (data.positives as PositiveKey[]) : [],
        negatives: Array.isArray(data?.negatives) ? (data.negatives as NegativeKey[]) : [],
        score: typeof data?.score === "number" ? data.score : 50,
        recorded: Boolean(data),
      };

      setLog(data ? fetchedLog : null);
      if (typeof window !== "undefined") {
        if (data) window.localStorage.setItem(getStorageKey(dateISO), JSON.stringify(fetchedLog));
        else window.localStorage.removeItem(getStorageKey(dateISO));
      }
    } catch (err) {
      console.error("Data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, dateISO]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const upsert = useCallback(
    async (positives: PositiveKey[], negatives: NegativeKey[]) => {
      if (!user) return;
      const score = computeScore(positives, negatives);
      const optimistic: DailyLog = { log_date: dateISO, positives, negatives, score, recorded: true };
      setLog(optimistic);
      if (typeof window !== "undefined") window.localStorage.setItem(getStorageKey(dateISO), JSON.stringify(optimistic));

      const { error } = await supabase
        .from("daily_logs")
        .upsert({ user_id: user.id, log_date: dateISO, positives, negatives, score }, { onConflict: "user_id,log_date" });
      if (error) console.error("Sync failed:", error);
    },
    [user, dateISO],
  );

  const togglePositive = useCallback(async (key: PositiveKey) => {
    const positives = log?.positives ?? [];
    const negatives = log?.negatives ?? [];
    await upsert(positives.includes(key) ? positives.filter((k) => k !== key) : [...positives, key], negatives);
  }, [log, upsert]);

  const toggleNegative = useCallback(async (key: NegativeKey) => {
    const positives = log?.positives ?? [];
    const negatives = log?.negatives ?? [];
    await upsert(positives, negatives.includes(key) ? negatives.filter((k) => k !== key) : [...negatives, key]);
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

export function useWeeklyLogs(days = 7) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setLogs([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      const dates = lastNDays(days);
      const start = dates[0];
      try {
        const { data, error } = await supabase
          .from("daily_logs")
          .select("log_date, positives, negatives, score")
          .eq("user_id", user.id)
          .gte("log_date", start)
          .order("log_date", { ascending: true });
        if (error) throw error;

        const byDate = new Map<string, DailyLog>();
        (data ?? []).forEach((d) => {
          byDate.set(d.log_date, {
            log_date: d.log_date,
            positives: (Array.isArray(d.positives) ? d.positives : []) as PositiveKey[],
            negatives: (Array.isArray(d.negatives) ? d.negatives : []) as NegativeKey[],
            score: typeof d.score === "number" ? d.score : 50,
            recorded: true,
          });
        });

        setLogs(dates.map((d) => byDate.get(d) ?? { log_date: d, positives: [], negatives: [], score: 0, recorded: false }));
      } catch (err) {
        console.error("Failed to load weekly logs:", err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user?.id, days]);

  return { logs, loading };
}
