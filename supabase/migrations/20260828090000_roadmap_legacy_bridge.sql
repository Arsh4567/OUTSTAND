-- Phase 4 / Step 1: safe compatibility bridge between canonical roadmaps and legacy ai_roadmaps.
-- This migration is intentionally additive: no legacy table, FK, or data is removed.

ALTER TABLE public.roadmaps
  ADD COLUMN IF NOT EXISTS legacy_ai_roadmap_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS roadmaps_legacy_ai_roadmap_id_uidx
  ON public.roadmaps (legacy_ai_roadmap_id)
  WHERE legacy_ai_roadmap_id IS NOT NULL;

COMMENT ON COLUMN public.roadmaps.legacy_ai_roadmap_id IS
  'Optional legacy ai_roadmaps.id used only as a migration bridge. NULL for roadmaps created natively in the canonical model.';

-- Keep the bridge non-destructive and user-scoped. Existing legacy rows are not
-- automatically copied because their schema/semantics must be mapped explicitly
-- before creating canonical milestones/tasks in a later migration step.
