export type TodayExecutionSummaryRow = {
  user_id: string;
  roadmap_id: string;
  task_id: string;
  day_number: number;
  task_order: number;
  title: string;
  instructions: string;
  success_criteria: string | null;
  estimated_minutes: number;
  start_time: string | null;
  end_time: string | null;
  is_required: boolean;
  status: "pending" | "in_progress" | "completed" | "skipped";
  completed_at: string | null;
  roadmap_title: string;
  roadmap_goal: string;
  target_date: string | null;
};
