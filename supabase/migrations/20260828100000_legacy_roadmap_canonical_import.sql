-- Phase 4 / Step 2 / Step 1: canonical importer for legacy ai_roadmaps.
-- This is intentionally additive and idempotent. It does not delete or mutate
-- the source ai_roadmaps row or any existing canonical roadmap data.

CREATE OR REPLACE FUNCTION public.import_legacy_ai_roadmap(p_legacy_roadmap_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  legacy public.ai_roadmaps%ROWTYPE;
  canonical_id uuid;
  milestone_item jsonb;
  action_item text;
  milestone_id uuid;
  milestone_idx integer := 0;
  action_idx integer;
  milestone_day integer;
  milestone_title text;
  milestone_outcome text;
  goal_text text;
  target_date date;
  existing_count integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO legacy
  FROM public.ai_roadmaps
  WHERE id = p_legacy_roadmap_id
    AND user_id = uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Legacy roadmap not found';
  END IF;

  SELECT id INTO canonical_id
  FROM public.roadmaps
  WHERE user_id = uid
    AND legacy_ai_roadmap_id = p_legacy_roadmap_id
  LIMIT 1;

  IF canonical_id IS NOT NULL THEN
    RETURN canonical_id;
  END IF;

  SELECT count(*) INTO existing_count
  FROM public.roadmaps
  WHERE user_id = uid
    AND status IN ('active','paused');

  IF existing_count >= 4 THEN
    RAISE EXCEPTION 'You can have a maximum of 4 active roadmaps.';
  END IF;

  goal_text := coalesce(nullif(trim(legacy.summary), ''), trim(legacy.title));
  target_date := current_date + greatest(legacy.duration_days - 1, 0);

  INSERT INTO public.roadmaps (
    user_id, title, goal, category, questionnaire, generation_metadata,
    duration_days, start_date, target_date, status, version, structured_content,
    legacy_ai_roadmap_id
  )
  VALUES (
    uid,
    left(trim(legacy.title), 200),
    left(goal_text, 2000),
    coalesce(nullif(trim(legacy.category), ''), 'custom'),
    coalesce(legacy.answers, '{}'::jsonb),
    jsonb_build_object('source','legacy_ai_roadmaps','legacy_id',legacy.id::text,'legacy_created_at',legacy.created_at),
    greatest(1, least(730, legacy.duration_days)),
    legacy.created_at::date,
    target_date,
    CASE WHEN legacy.is_active THEN 'active' ELSE 'archived' END,
    1,
    '[]'::jsonb,
    legacy.id
  )
  RETURNING id INTO canonical_id;

  FOR milestone_item IN
    SELECT value
    FROM jsonb_array_elements(coalesce(legacy.plan -> 'milestones', '[]'::jsonb))
  LOOP
    milestone_idx := milestone_idx + 1;
    milestone_day := greatest(1, coalesce((milestone_item ->> 'day')::integer, milestone_idx));
    milestone_title := left(coalesce(nullif(trim(milestone_item ->> 'title'), ''), 'Milestone ' || milestone_idx::text), 200);
    milestone_outcome := nullif(trim(milestone_item ->> 'outcome'), '');

    INSERT INTO public.roadmap_milestones (
      roadmap_id, user_id, milestone_order, day_start, day_end,
      title, outcome, description, methodology_tags
    )
    VALUES (
      canonical_id, uid, milestone_idx, milestone_day, milestone_day,
      milestone_title, left(milestone_outcome, 2000), NULL, '{}'::text[]
    )
    RETURNING id INTO milestone_id;

    action_idx := 0;
    FOR action_item IN
      SELECT value
      FROM jsonb_array_elements_text(coalesce(milestone_item -> 'actions', '[]'::jsonb))
    LOOP
      action_idx := action_idx + 1;
      IF length(trim(action_item)) = 0 THEN
        CONTINUE;
      END IF;

      INSERT INTO public.roadmap_tasks (
        roadmap_id, milestone_id, user_id, day_number, task_order,
        title, instructions, estimated_minutes, task_type, methodology_tags,
        resources, difficulty, success_criteria, is_required, guidance
      )
      VALUES (
        canonical_id,
        milestone_id,
        uid,
        milestone_day,
        action_idx,
        left(trim(action_item), 200),
        left(coalesce(milestone_outcome, trim(action_item)), 4000),
        30,
        'practice',
        '{}'::text[],
        '[]'::jsonb,
        nullif(trim(legacy.difficulty), ''),
        left(trim(action_item), 1000),
        true,
        '{}'::jsonb
      );
    END LOOP;
  END LOOP;

  RETURN canonical_id;
END;
$$;

REVOKE ALL ON FUNCTION public.import_legacy_ai_roadmap(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.import_legacy_ai_roadmap(uuid) TO authenticated;
