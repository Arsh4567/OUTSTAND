create or replace function public.enforce_roadmap_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if coalesce(new.status, 'active') not in ('active', 'paused') then
    return new;
  end if;

  select count(*) into v_count
  from public.roadmaps
  where user_id = new.user_id
    and status in ('active', 'paused')
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if v_count >= 4 then
    raise exception 'You can have a maximum of 4 roadmaps.';
  end if;

  return new;
end;
$$;

drop trigger if exists roadmap_limit_guard on public.roadmaps;
create trigger roadmap_limit_guard
before insert on public.roadmaps
for each row execute function public.enforce_roadmap_limit();

create or replace function public.validate_roadmap_task_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duration integer;
begin
  select duration_days into v_duration
  from public.roadmaps
  where id = new.roadmap_id
    and user_id = new.user_id;

  if v_duration is null then
    raise exception 'Roadmap not found or task owner mismatch';
  end if;

  if new.day_number is null or new.day_number < 1 or new.day_number > v_duration then
    raise exception 'Task day must be between 1 and the roadmap duration.';
  end if;

  if new.start_time is not null and new.end_time is not null and new.end_time <= new.start_time then
    raise exception 'Task end time must be after its start time.';
  end if;

  return new;
end;
$$;

drop trigger if exists roadmap_task_integrity_guard on public.roadmap_tasks;
create trigger roadmap_task_integrity_guard
before insert or update of roadmap_id, user_id, day_number, start_time, end_time on public.roadmap_tasks
for each row execute function public.validate_roadmap_task_integrity();

create or replace function public.sync_roadmap_milestone_range()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_milestone_id uuid;
begin
  v_milestone_id := coalesce(new.milestone_id, old.milestone_id);

  if v_milestone_id is null then
    return coalesce(new, old);
  end if;

  update public.roadmap_milestones m
  set day_start = coalesce((select min(t.day_number) from public.roadmap_tasks t where t.milestone_id = v_milestone_id), m.day_start),
      day_end = coalesce((select max(t.day_number) from public.roadmap_tasks t where t.milestone_id = v_milestone_id), m.day_end)
  where m.id = v_milestone_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists roadmap_milestone_range_sync on public.roadmap_tasks;
create trigger roadmap_milestone_range_sync
after insert or update of milestone_id, day_number or delete on public.roadmap_tasks
for each row execute function public.sync_roadmap_milestone_range();

create or replace function public.seed_basic_roadmap_structure()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_milestone_id uuid;
  v_title text;
begin
  if coalesce(new.generation_metadata->>'source', '') = 'assistant' then
    return new;
  end if;

  if exists (select 1 from public.roadmap_milestones where roadmap_id = new.id) then
    return new;
  end if;

  v_title := left(coalesce(nullif(trim(new.title), ''), 'First milestone'), 200);

  insert into public.roadmap_milestones (
    roadmap_id, user_id, milestone_order, day_start, day_end, title, outcome, description, methodology_tags
  ) values (
    new.id, new.user_id, 1, 1, 1, v_title, new.goal, 'Start with a concrete first step toward the roadmap goal.', '{}'::text[]
  ) returning id into v_milestone_id;

  insert into public.roadmap_tasks (
    roadmap_id, milestone_id, user_id, day_number, task_order, title, instructions,
    estimated_minutes, task_type, methodology_tags, resources, is_required, guidance
  ) values (
    new.id, v_milestone_id, new.user_id, 1, 1,
    left('Start: ' || coalesce(nullif(trim(new.goal), ''), 'define your first step'), 200),
    left('Define the first concrete action you will complete for this roadmap: ' || coalesce(new.goal, new.title), 2000),
    20, 'setup', '{}'::text[], '[]'::jsonb, true, '{}'::jsonb
  );

  return new;
end;
$$;

drop trigger if exists roadmap_basic_structure_seed on public.roadmaps;
create trigger roadmap_basic_structure_seed
after insert on public.roadmaps
for each row execute function public.seed_basic_roadmap_structure();

-- Keep the canonical AI-created roadmap path aligned with the same four-roadmap rule.
create or replace function public.create_canonical_roadmap_from_plan(
  p_category text,
  p_title text,
  p_goal text,
  p_questionnaire jsonb default '{}'::jsonb,
  p_generation_metadata jsonb default '{}'::jsonb,
  p_duration_days integer default 1,
  p_start_date date default current_date,
  p_plan jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_roadmap_id uuid;
  v_milestone_id uuid;
  v_milestone jsonb;
  v_action text;
  v_milestone_order integer := 0;
  v_action_order integer;
  v_day integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'Roadmap title is required'; end if;
  if coalesce(p_duration_days, 0) < 1 then raise exception 'Roadmap duration must be at least one day'; end if;
  if (select count(*) from public.roadmaps where user_id = v_user_id and status in ('active', 'paused')) >= 4 then
    raise exception 'You can have at most 4 roadmaps';
  end if;

  insert into public.roadmaps (
    user_id, title, goal, category, questionnaire, generation_metadata,
    duration_days, start_date, target_date, status, version, structured_content
  ) values (
    v_user_id, trim(p_title), coalesce(nullif(trim(p_goal), ''), trim(p_title)),
    coalesce(nullif(trim(p_category), ''), 'custom'), coalesce(p_questionnaire, '{}'::jsonb),
    coalesce(p_generation_metadata, '{}'::jsonb), p_duration_days, coalesce(p_start_date, current_date),
    coalesce(p_start_date, current_date) + greatest(p_duration_days - 1, 0), 'active', 1, coalesce(p_plan, '{}'::jsonb)
  ) returning id into v_roadmap_id;

  for v_milestone in select value from jsonb_array_elements(coalesce(p_plan->'milestones', '[]'::jsonb)) loop
    v_milestone_order := v_milestone_order + 1;
    v_day := greatest(1, least(p_duration_days, coalesce((v_milestone->>'day')::integer, v_milestone_order)));

    insert into public.roadmap_milestones (
      roadmap_id, user_id, milestone_order, day_start, day_end, title, outcome, description, methodology_tags
    ) values (
      v_roadmap_id, v_user_id, v_milestone_order, v_day, v_day,
      coalesce(nullif(trim(v_milestone->>'title'), ''), 'Milestone ' || v_milestone_order),
      nullif(v_milestone->>'outcome', ''), null, '{}'::text[]
    ) returning id into v_milestone_id;

    v_action_order := 0;
    for v_action in select value from jsonb_array_elements_text(coalesce(v_milestone->'actions', '[]'::jsonb)) loop
      v_action_order := v_action_order + 1;
      insert into public.roadmap_tasks (
        roadmap_id, milestone_id, user_id, day_number, task_order, title, instructions,
        estimated_minutes, task_type, methodology_tags, resources, is_required, guidance
      ) values (
        v_roadmap_id, v_milestone_id, v_user_id, v_day, v_action_order, v_action, v_action,
        null, 'practice', '{}'::text[], '[]'::jsonb, true, '{}'::jsonb
      );
    end loop;
  end loop;

  if not exists (select 1 from public.roadmap_milestones where roadmap_id = v_roadmap_id) then
    raise exception 'Generated roadmap contains no milestones';
  end if;

  return v_roadmap_id;
end;
$$;

revoke all on function public.create_canonical_roadmap_from_plan(text,text,text,jsonb,jsonb,integer,date,jsonb) from public, anon;
grant execute on function public.create_canonical_roadmap_from_plan(text,text,text,jsonb,jsonb,integer,date,jsonb) to authenticated;
