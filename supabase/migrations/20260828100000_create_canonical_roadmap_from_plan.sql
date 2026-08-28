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
  if (select count(*) from public.roadmaps where user_id = v_user_id and status = 'active') >= 4 then
    raise exception 'You can have at most 4 active roadmaps';
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
    v_day := greatest(1, coalesce((v_milestone->>'day')::integer, v_milestone_order));

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
