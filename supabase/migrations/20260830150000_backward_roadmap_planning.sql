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
  v_task jsonb;
  v_action text;
  v_milestone_order integer := 0;
  v_task_order integer;
  v_day integer;
  v_task_count integer := 0;
  v_capability_count integer := 0;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'Roadmap title is required'; end if;
  if coalesce(trim(p_goal), '') = '' then raise exception 'Roadmap goal is required'; end if;
  if coalesce(p_duration_days, 0) < 7 or coalesce(p_duration_days, 0) > 180 then raise exception 'Roadmap duration must be between 7 and 180 days'; end if;
  if jsonb_typeof(coalesce(p_plan, '{}'::jsonb)->'outcome') <> 'object' then raise exception 'Backward plan outcome is required'; end if;
  if coalesce(trim(p_plan->'outcome'->>'outcome'), '') = '' or coalesce(trim(p_plan->'outcome'->>'metric'), '') = '' or coalesce(trim(p_plan->'outcome'->>'target'), '') = '' then
    raise exception 'Backward plan must contain a measurable outcome, metric, and target';
  end if;
  if jsonb_typeof(coalesce(p_plan, '{}'::jsonb)->'capabilities') <> 'array' then raise exception 'Backward plan capabilities are required'; end if;
  select count(*) into v_capability_count from jsonb_array_elements(coalesce(p_plan->'capabilities', '[]'::jsonb)) where coalesce(trim(value->>'name'), '') <> '' and coalesce(trim(value->>'reason'), '') <> '';
  if v_capability_count = 0 then raise exception 'Backward plan must identify at least one required capability'; end if;
  if jsonb_typeof(coalesce(p_plan, '{}'::jsonb)->'milestones') <> 'array' then raise exception 'Backward plan milestones are required'; end if;
  if (select count(*) from public.roadmaps where user_id = v_user_id and status in ('active','paused')) >= 4 then raise exception 'You can have at most 4 active roadmaps'; end if;

  insert into public.roadmaps (
    user_id, title, goal, category, questionnaire, generation_metadata,
    duration_days, start_date, target_date, status, version, structured_content
  ) values (
    v_user_id, trim(p_title), trim(p_goal), coalesce(nullif(trim(p_category), ''), 'custom'),
    coalesce(p_questionnaire, '{}'::jsonb),
    jsonb_set(coalesce(p_generation_metadata, '{}'::jsonb), '{planning}', p_plan, true),
    p_duration_days, coalesce(p_start_date, current_date),
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
      nullif(trim(v_milestone->>'outcome'), ''),
      nullif(trim(v_milestone->>'taskFocus'), ''),
      coalesce(array(select jsonb_array_elements_text(coalesce(v_milestone->'methodologyTags', '[]'::jsonb))), '{}'::text[])
    ) returning id into v_milestone_id;

    v_task_order := 0;
    if jsonb_typeof(v_milestone->'tasks') = 'array' and jsonb_array_length(v_milestone->'tasks') > 0 then
      for v_task in select value from jsonb_array_elements(v_milestone->'tasks') loop
        v_task_order := v_task_order + 1;
        insert into public.roadmap_tasks (
          roadmap_id, milestone_id, user_id, day_number, task_order, title, instructions,
          estimated_minutes, task_type, methodology_tags, resources, is_required, guidance, success_criteria
        ) values (
          v_roadmap_id, v_milestone_id, v_user_id, v_day, v_task_order,
          trim(v_task->>'title'), coalesce(nullif(trim(v_task->>'instructions'), ''), trim(v_task->>'title')),
          greatest(5, least(240, coalesce((v_task->>'estimatedMinutes')::integer, 30))),
          coalesce(nullif(trim(v_task->>'taskType'), ''), 'practice'),
          coalesce(array(select jsonb_array_elements_text(coalesce(v_task->'methodologyTags', '[]'::jsonb))), '{}'::text[]),
          coalesce(v_task->'resources', '[]'::jsonb), coalesce((v_task->>'isRequired')::boolean, true),
          coalesce(v_task->'guidance', '{}'::jsonb), nullif(trim(v_task->>'successCriteria'), '')
        );
        v_task_count := v_task_count + 1;
      end loop;
    else
      for v_action in select value from jsonb_array_elements_text(coalesce(v_milestone->'actions', '[]'::jsonb)) loop
        v_task_order := v_task_order + 1;
        insert into public.roadmap_tasks (
          roadmap_id, milestone_id, user_id, day_number, task_order, title, instructions,
          estimated_minutes, task_type, methodology_tags, resources, is_required, guidance, success_criteria
        ) values (
          v_roadmap_id, v_milestone_id, v_user_id, v_day, v_task_order, trim(v_action), trim(v_action),
          30, 'practice', '{}'::text[], '[]'::jsonb, true, '{}'::jsonb, 'Complete the task as written and record the requested output.'
        );
        v_task_count := v_task_count + 1;
      end loop;
    end if;
  end loop;

  if v_milestone_order = 0 then raise exception 'Generated roadmap contains no milestones'; end if;
  if v_task_count = 0 then raise exception 'Generated roadmap contains no executable tasks'; end if;
  return v_roadmap_id;
end;
$$;

revoke all on function public.create_canonical_roadmap_from_plan(text,text,text,jsonb,jsonb,integer,date,jsonb) from public, anon;
grant execute on function public.create_canonical_roadmap_from_plan(text,text,text,jsonb,jsonb,integer,date,jsonb) to authenticated;
