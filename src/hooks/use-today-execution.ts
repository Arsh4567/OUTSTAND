import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getExecutionSummary, type ExecutionTask } from "@/lib/today-execution";
import type { TodayExecutionSummaryRow } from "@/integrations/supabase/types";

type TodayExecutionRow = Pick<
  TodayExecutionSummaryRow,
  "task_id" | "roadmap_id" | "title" | "instructions" | "success_criteria" | "estimated_minutes" | "start_time" | "end_time" | "is_required" | "status"
>;

function normalize(row: TodayExecutionRow): ExecutionTask {
  return {
    id: String(row.task_id),
    roadmapId: String(row.roadmap_id),
    title: String(row.title),
    instructions: String(row.instructions || row.title),
    successCriteria: row.success_criteria,
    estimatedMinutes: Math.max(1, Number(row.estimated_minutes) || 30),
    startTime: row.start_time,
    endTime: row.end_time,
    isRequired: Boolean(row.is_required),
    status: (row.status as ExecutionTask["status"]) || "pending",
  };
}

export function useTodayExecution() {
  const [tasks, setTasks] = useState<ExecutionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      setError(sessionError.message);
      setLoading(false);
      return;
    }
    if (!session) {
      setError("Please sign in to view today's plan.");
      setLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("today_execution_summary" as never)
      .select("task_id, roadmap_id, title, instructions, success_criteria, estimated_minutes, start_time, end_time, is_required, status")
      .eq("user_id" as never, session.user.id);

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    setTasks(((data || []) as TodayExecutionRow[]).filter((row) => row.task_id && row.roadmap_id && row.title).map(normalize));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => getExecutionSummary(tasks), [tasks]);

  return { tasks, summary, loading, error, reload: load };
}
