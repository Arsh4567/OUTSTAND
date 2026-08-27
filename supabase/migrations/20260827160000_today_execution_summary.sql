create or replace view public.today_execution_summary
with (security_invoker = true)
as
select
  t.user_id,
  t.roadmap_id,
  t.id as task_id,
  t.day_number,
  t.task_order,
  t.title,
  t.instructions,
  t.success_criteria,
  coalesce(t.estimated_minutes, 30) as estimated_minutes,
  t.start_time,
  t.end_time,
  t.is_required,
  coalesce(p.status, 'pending') as status,
  p.completed_at,
  r.title as roadmap_title,
  r.goal as roadmap_goal,
  r.target_date
from public.roadmap_tasks t
join public.roadmaps r
  on r.id = t.roadmap_id
 and r.user_id = t.user_id
left join public.roadmap_task_progress p
  on p.task_id = t.id
 and p.roadmap_id = t.roadmap_id
 and p.user_id = t.user_id
where t.day_number = greatest(
    1,
    least(r.duration_days, current_date - r.start_date + 1)
  )
  and r.status = 'active';

revoke select on public.today_execution_summary from anon;
grant select on public.today_execution_summary to authenticated;
