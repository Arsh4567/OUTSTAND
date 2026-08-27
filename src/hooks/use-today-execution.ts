import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getExecutionSummary, type ExecutionTask } from "@/lib/today-execution";

type TodayExecutionRow = {
  task_id: string;
  roadmap_id: string;
  title: string;
  instructions: string;
  success_criteria: string | null;
  estimated_minutes: number | null;
  start_time: string | null;
  end_time: string | null;
  is_required: boolean;
  status: "pending" | "in_progress" | "completed" | "skipped";
};

function normalize(row: TodayExecutionRow): ExecutionTask {
  return {
    id: row.task_id,
    roadmapId: row.roadmap_id,
    title: row.title,
    instructions: row.instructions,
    successCriteria: row.success_criteria,
    estimatedMinutes: Math.max(1, Number(row.estimated_minutes) || 30),
    startTime: row.start_time,
    endTime: row.end_time,
    isRequired: Boolean(row.is_required),
    status: row.status || "pending",
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
      .select("task_id, roadmap_id, title, instructions, success_criteria, estimated_minutes, start_time, end_time, is_required, status");

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    setTasks(((data || []) as TodayExecutionRow[]).map(normalize));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => getExecutionSummary(tasks), [tasks]);

  return { tasks, summary, loading, error, reload: load };
}
