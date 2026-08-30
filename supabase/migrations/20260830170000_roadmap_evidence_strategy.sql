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
  v_milestone_order integer := 0;
  v_task_order integer;
  v_day integer;
  v_strategy jsonb := coalesce(p_plan->'strategy', '{}'::jsonb);
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'Roadmap title is required'; end if;
  if coalesce(trim(p_goal), '') = '' then raise exception 'Roadmap goal is required'; end if;
  if coalesce(p_duration_days, 0) < 1 then raise exception 'Roadmap duration must be at least one day'; end if;
  if (select count(*) from public.roadmaps where user_id = v_user_id and status in ('active', 'paused')) >= 4 then
    raise exception 'You can have at most 4 roadmaps';
  end if;
  if jsonb_typeof(v_strategy) <> 'object' then raise exception 'Roadmap strategy must be an object'; end if;

  insert into public.roadmaps (
    user_id, title, goal, category, questionnaire, generation_metadata,
    duration_days, start_date, target_date, status, version, structured_content
  ) values (
    v_user_id, trim(p_title), trim(p_goal), coalesce(nullif(trim(p_category), ''), 'custom'),
    coalesce(p_questionnaire, '{}'::jsonb),
    coalesce(p_generation_metadata, '{}'::jsonb) || jsonb_build_object('strategy', v_strategy),
    p_duration_days, coalesce(p_start_date, current_date),
    coalesce(p_start_date, current_date) + greatest(p_duration_days - 1, 0), 'active', 1,
    coalesce(p_plan, '{}'::jsonb)
  ) returning id into v_roadmap_id;

  for v_milestone in select value from jsonb_array_elements(coalesce(p_plan->'milestones', '[]'::jsonb)) loop
    v_milestone_order := v_milestone_order + 1;
    v_day := greatest(1, least(p_duration_days, coalesce((v_milestone->>'day')::integer, v_milestone_order)));

    insert into public.roadmap_milestones (
      roadmap_id, user_id, milestone_order, day_start, day_end, title, outcome, description, methodology_tags
    ) values (
      v_roadmap_id, v_user_id, v_milestone_order, v_day, v_day,
      coalesce(nullif(trim(v_milestone->>'title'), ''), 'Milestone ' || v_milestone_order),
      nullif(v_milestone->>'outcome', ''),
      nullif(v_milestone->>'description', ''),
      case when jsonb_typeof(v_milestone->'methodologyTags') = 'array'
        then array(select jsonb_array_elements_text(v_milestone->'methodologyTags'))
        else '{}'::text[] end
    ) returning id into v_milestone_id;

    v_task_order := 0;
    for v_task in select value from jsonb_array_elements(coalesce(v_milestone->'tasks', v_milestone->'actions', '[]'::jsonb)) loop
      v_task_order := v_task_order + 1;
      if jsonb_typeof(v_task) = 'string' then
        v_task := jsonb_build_object('title', v_task, 'instructions', v_task);
      end if;
      insert into public.roadmap_tasks (
        roadmap_id, milestone_id, user_id, day_number, task_order, title, instructions,
        estimated_minutes, task_type, methodology_tags, resources, is_required, guidance, success_criteria
      ) values (
        v_roadmap_id, v_milestone_id, v_user_id, v_day, v_task_order,
        left(coalesce(nullif(trim(v_task->>'title'), ''), 'Task ' || v_task_order), 200),
        left(coalesce(nullif(trim(v_task->>'instructions'), ''), v_task->>'title', 'Complete this task.'), 4000),
        greatest(5, least(240, coalesce((v_task->>'estimatedMinutes')::integer, 25))),
        coalesce(nullif(v_task->>'taskType', ''), 'practice'),
        case when jsonb_typeof(v_task->'methodologyTags') = 'array'
          then array(select jsonb_array_elements_text(v_task->'methodologyTags'))
          else '{}'::text[] end,
        coalesce(v_task->'resources', '[]'::jsonb),
        coalesce((v_task->>'isRequired')::boolean, true),
        coalesce(v_task->'guidance', '{}'::jsonb),
        nullif(trim(v_task->>'successCriteria'), '')
      );
    end loop;
  end loop;

  if not exists (select 1 from public.roadmap_milestones where roadmap_id = v_roadmap_id) then
    raise exception 'Generated roadmap contains no milestones';
  end if;
  if not exists (select 1 from public.roadmap_tasks where roadmap_id = v_roadmap_id) then
    raise exception 'Generated roadmap contains no tasks';
  end if;

  return v_roadmap_id;
end;
$$;

revoke all on function public.create_canonical_roadmap_from_plan(text,text,text,jsonb,jsonb,integer,date,jsonb) from public, anon;
grant execute on function public.create_canonical_roadmap_from_plan(text,text,text,jsonb,jsonb,integer,date,jsonb) to authenticated;
