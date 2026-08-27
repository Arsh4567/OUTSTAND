export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type TodayExecutionSummaryRow = {
  completed_at: string | null
  day_number: number | null
  end_time: string | null
  estimated_minutes: number | null
  instructions: string | null
  is_required: boolean | null
  roadmap_goal: string | null
  roadmap_id: string | null
  roadmap_title: string | null
  start_time: string | null
  status: string | null
  success_criteria: string | null
  target_date: string | null
  task_id: string | null
  task_order: number | null
  title: string | null
  user_id: string | null
}
