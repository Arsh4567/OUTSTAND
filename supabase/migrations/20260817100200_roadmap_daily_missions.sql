alter table public.daily_quests
  add column if not exists roadmap_id uuid references public.ai_roadmaps(id) on delete cascade,
  add column if not exists roadmap_day integer,
  add column if not exists source_key text;

create index if not exists daily_quests_roadmap_idx
  on public.daily_quests(user_id, roadmap_id, assigned_date);

create unique index if not exists daily_quests_user_date_source_idx
  on public.daily_quests(user_id, assigned_date, source_key)
  where source_key is not null;

create or replace function public.sync_ai_roadmap_today_missions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  roadmap record;
  milestone jsonb;
  action text;
  action_index integer;
  target_day integer;
  created_count integer := 0;
  quest_id uuid;
  daily_id uuid;
  mission_key text;
  difficulty_value text;
  xp_value integer;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select id, category, difficulty, duration_days, created_at, plan
    into roadmap
  from public.ai_roadmaps
  where user_id = uid
    and is_active = true
    and created_at::date <= current_date
    and created_at::date + greatest(duration_days - 1, 0) >= current_date
  order by created_at desc
  limit 1;

  if not found or coalesce(jsonb_typeof(roadmap.plan -> 'milestones'), 'null') <> 'array' then
    return 0;
  end if;

  target_day := greatest(1, (current_date - roadmap.created_at::date) + 1);
  difficulty_value := coalesce(nullif(roadmap.difficulty, ''), 'Balanced');
  xp_value := case lower(difficulty_value)
    when 'gentle' then 25
    when 'challenging' then 60
    else 40
  end;

  for milestone in
    select value
    from jsonb_array_elements(roadmap.plan -> 'milestones')
    where coalesce((value ->> 'day')::integer, -1) = target_day
  loop
    action_index := 0;
    for action in
      select value
      from jsonb_array_elements_text(coalesce(milestone -> 'actions', '[]'::jsonb))
    loop
      action_index := action_index + 1;
      if length(trim(action)) = 0 then
        continue;
      end if;

      mission_key := roadmap.id::text || ':day:' || target_day::text || ':action:' || action_index::text;

      select dq.id into daily_id
      from public.daily_quests dq
      where dq.user_id = uid
        and dq.assigned_date = current_date
        and dq.source_key = mission_key
      limit 1;

      if daily_id is not null then
        continue;
      end if;

      select q.id into quest_id
      from public.quests q
      where q.title = trim(action)
        and q.category = 'Roadmap'
        and q.difficulty = difficulty_value
        and q.is_active = true
      limit 1;

      if quest_id is null then
        insert into public.quests(title, category, difficulty, xp_reward, is_active)
        values (trim(action), 'Roadmap', difficulty_value, xp_value, true)
        returning id into quest_id;
      end if;

      insert into public.daily_quests(user_id, quest_id, assigned_date, completed, roadmap_id, roadmap_day, source_key)
      values (uid, quest_id, current_date, false, roadmap.id, target_day, mission_key)
      on conflict (user_id, assigned_date, source_key) where source_key is not null do nothing;

      if found then
        created_count := created_count + 1;
      end if;
    end loop;
  end loop;

  return created_count;
end;
$$;

revoke all on function public.sync_ai_roadmap_today_missions() from public;
grant execute on function public.sync_ai_roadmap_today_missions() to authenticated;
