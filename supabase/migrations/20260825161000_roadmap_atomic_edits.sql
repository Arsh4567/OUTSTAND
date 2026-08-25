create or replace function public.relocate_roadmap_tasks(
  p_roadmap_id uuid,
  p_start_minute integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  task_row record;
  cursor_minute integer := p_start_minute;
  duration_minutes integer;
  updated_count integer := 0;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_start_minute < 0 or p_start_minute > 1439 then
    raise exception 'Invalid start minute';
  end if;

  if not exists (
    select 1
    from public.roadmaps r
    where r.id = p_roadmap_id
      and r.user_id = uid
  ) then
    raise exception 'Roadmap not found';
  end if;

  for task_row in
    select id, start_time, end_time
    from public.roadmap_tasks
    where roadmap_id = p_roadmap_id
      and user_id = uid
    order by day_number, task_order
    for update
  loop
    if task_row.start_time is null or task_row.end_time is null then
      continue;
    end if;

    duration_minutes := extract(hour from (task_row.end_time - task_row.start_time))::integer * 60
      + extract(minute from (task_row.end_time - task_row.start_time))::integer;

    if duration_minutes <= 0 then
      continue;
    end if;

    update public.roadmap_tasks
    set start_time = make_time((cursor_minute / 60)::integer, (cursor_minute % 60)::integer, 0)::time,
        end_time = make_time(((cursor_minute + duration_minutes) / 60)::integer % 24, ((cursor_minute + duration_minutes) % 60)::integer, 0)::time
    where id = task_row.id
      and roadmap_id = p_roadmap_id
      and user_id = uid;

    updated_count := updated_count + 1;
    cursor_minute := cursor_minute + duration_minutes + 15;

    if cursor_minute >= 1410 then
      exit;
    end if;
  end loop;

  return updated_count;
end;
$$;

revoke all on function public.relocate_roadmap_tasks(uuid, integer) from public;
grant execute on function public.relocate_roadmap_tasks(uuid, integer) to authenticated;
