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

// ... (keep your useDailyLog function here, but we focus on the Weekly hook)

/**
 * HARDENED useWeeklyLogs
 * This version guarantees it NEVER returns undefined, preventing Profile crashes.
 */
export function useWeeklyLogs(days = 7) {
  const { user } = useAuth();
  // Initialize with empty array so UI components don't crash on mount
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setLogs([]); // Ensure we return empty array, not undefined
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

        // Map existing data into a map for fast lookup
        const byDate = new Map<string, DailyLog>();
        (data ?? []).forEach((d) => {
          byDate.set(d.log_date, {
            log_date: d.log_date,
            positives: (Array.isArray(d.positives) ? d.positives : []) as PositiveKey[],
            negatives: (Array.isArray(d.negatives) ? d.negatives : []) as NegativeKey[],
            score: typeof d.score === 'number' ? d.score : 50,
          });
        });

        // Fill in missing dates so the chart doesn't break
        const completeLogs = dates.map((d) => 
          byDate.get(d) ?? { log_date: d, positives: [], negatives: [], score: 50 }
        );

        setLogs(completeLogs);
      } catch (err) {
        console.error("Failed to load weekly logs:", err);
        setLogs([]); // Crash prevention
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id, days]);

  return { logs, loading };
}
