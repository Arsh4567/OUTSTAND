import { useCallback, useEffect, useState } from "react";
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

export function useDailyLog(dateISO: string = todayISO()) {
  const { user } = useAuth();
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setLog(null);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("log_date, positives, negatives, score")
        .eq("user_id", user.id)
        .eq("log_date", dateISO)
        .maybeSingle();

      if (error) throw error;
      setLog({
        log_date: data?.log_date ?? dateISO,
        positives: Array.isArray(data?.positives) ? (data.positives as PositiveKey[]) : [],
        negatives: Array.isArray(data?.negatives) ? (data.negatives as NegativeKey[]) : [],
        score: typeof data?.score === "number" ? data.score : 50,
      });
    } catch (error) {
      console.error("Failed to load daily log:", error);
      setLog(null);
    } finally {
      setLoading(false);
    }
  }, [user, dateISO]);

  useEffect(() => { void refetch(); }, [refetch]);

  const upsert = useCallback(async (positives: PositiveKey[], negatives: NegativeKey[]) => {
    if (!user) return;
    const score = computeScore(positives, negatives);
    const optimistic: DailyLog = { log_date: dateISO, positives, negatives, score };
    setLog(optimistic);

    const { error } = await supabase
      .from("daily_logs")
      .upsert({ user_id: user.id, log_date: dateISO, positives, negatives, score }, { onConflict: "user_id,log_date" });
    if (error) {
      console.error("Failed to persist daily log:", error);
      await refetch();
    }
  }, [user, dateISO, refetch]);

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
        (data ?? []).forEach((d) => byDate.set(d.log_date, {
          log_date: d.log_date,
          positives: (Array.isArray(d.positives) ? d.positives : []) as PositiveKey[],
          negatives: (Array.isArray(d.negatives) ? d.negatives : []) as NegativeKey[],
          score: typeof d.score === "number" ? d.score : 50,
        }));
        setLogs(dates.map((d) => byDate.get(d) ?? { log_date: d, positives: [], negatives: [], score: 50 }));
      } catch (error) {
        console.error("Failed to load weekly logs:", error);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user?.id, days]);

  return { logs, loading };
}
